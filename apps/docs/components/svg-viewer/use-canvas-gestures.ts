"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { MAX_ZOOM, MIN_ZOOM, ZOOM_STEP } from "./constants";
import { roundZoom } from "./math";
import type { Point, Size } from "./types";

const DEFAULT_SIZE: Size = { width: 1, height: 1 };

function resetSvgForMeasurement(svgEl: SVGSVGElement) {
  svgEl.removeAttribute("width");
  svgEl.removeAttribute("height");
  svgEl.style.maxWidth = "none";
  svgEl.style.width = "auto";
  svgEl.style.height = "auto";
}

function fillSvgContainer(svgEl: SVGSVGElement) {
  svgEl.style.width = "100%";
  svgEl.style.height = "100%";
  svgEl.style.maxWidth = "none";
  svgEl.style.margin = "0";
  svgEl.style.display = "block";
}

function getSvgSize(svgEl: SVGSVGElement): Size | null {
  const viewBox = svgEl.viewBox?.baseVal;
  let width = viewBox?.width && viewBox.width > 0 ? viewBox.width : 0;
  let height = viewBox?.height && viewBox.height > 0 ? viewBox.height : 0;

  if (!width || !height) {
    const rect = svgEl.getBoundingClientRect();
    width = rect.width || svgEl.scrollWidth;
    height = rect.height || svgEl.scrollHeight;
  }

  return width && height ? { width, height } : null;
}

/**
 * Measures the embedded SVG inside `contentRef` and provides zoom / pan
 * controls that keep the diagram centered while zooming around the pointer
 * or viewport center.
 *
 * @param viewportRef - Scrollable container element
 * @param contentRef  - Element wrapping the SVG (used for measurement)
 * @param onInteraction - Optional callback fired on the first user gesture
 *                        (useful to skip auto-fit after manual zoom/pan)
 */
export function useCanvasGestures(
  viewportRef: RefObject<HTMLDivElement | null>,
  contentRef: RefObject<HTMLDivElement | null>,
  onInteraction?: () => void,
) {
  const [zoom, setZoom] = useState(1);
  const [contentSize, setContentSize] = useState<Size>(DEFAULT_SIZE);
  const [viewportSize, setViewportSize] = useState<Size>(DEFAULT_SIZE);

  const zoomRef = useRef(1);
  const initialZoomRef = useRef(1);
  const contentSizeRef = useRef<Size>(DEFAULT_SIZE);
  const viewportSizeRef = useRef<Size>(DEFAULT_SIZE);

  const clampZoom = useCallback((value: number) => {
    const minZoom = Math.min(MIN_ZOOM, initialZoomRef.current);
    return Math.min(MAX_ZOOM, Math.max(minZoom, roundZoom(value)));
  }, []);

  const getCanvasSize = useCallback((scale: number) => {
    const scaledWidth = contentSizeRef.current.width * scale;
    const scaledHeight = contentSizeRef.current.height * scale;

    return {
      width: Math.max(viewportSizeRef.current.width, scaledWidth),
      height: Math.max(viewportSizeRef.current.height, scaledHeight),
      scaledWidth,
      scaledHeight,
    };
  }, []);

  const applyZoom = useCallback((nextZoom: number) => {
    zoomRef.current = nextZoom;
    setZoom(nextZoom);
  }, []);

  /** Measures the SVG's intrinsic size and scales to fit the viewport. */
  const measureAndFit = useCallback(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;

    const viewportWidth = viewport.clientWidth;
    const viewportHeight = viewport.clientHeight;
    if (!viewportWidth || !viewportHeight) return;

    const svgEl = content.querySelector("svg");
    if (!svgEl) return;

    resetSvgForMeasurement(svgEl);
    const nextContentSize = getSvgSize(svgEl);
    if (!nextContentSize) return;

    fillSvgContainer(svgEl);

    const nextViewportSize = { width: viewportWidth, height: viewportHeight };
    const fitZoom = roundZoom(
      Math.min(
        MAX_ZOOM,
        viewportWidth / nextContentSize.width,
        viewportHeight / nextContentSize.height,
      ),
    );

    contentSizeRef.current = nextContentSize;
    viewportSizeRef.current = nextViewportSize;
    initialZoomRef.current = fitZoom;

    setContentSize(nextContentSize);
    setViewportSize(nextViewportSize);
    applyZoom(fitZoom);

    viewport.scrollLeft = 0;
    viewport.scrollTop = 0;
  }, [applyZoom, contentRef, viewportRef]);

  /** Zooms to `nextRaw` level keeping `focal` (viewport-local) stationary. */
  const zoomAroundPoint = useCallback(
    (nextRaw: number, focal?: Point) => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      const nextZoom = clampZoom(nextRaw);
      const anchor = focal ?? {
        x: viewport.clientWidth / 2,
        y: viewport.clientHeight / 2,
      };

      const currentCanvas = getCanvasSize(zoomRef.current);
      const nextCanvas = getCanvasSize(nextZoom);
      const currentOffsetX =
        (currentCanvas.width - currentCanvas.scaledWidth) / 2;
      const currentOffsetY =
        (currentCanvas.height - currentCanvas.scaledHeight) / 2;
      const nextOffsetX = (nextCanvas.width - nextCanvas.scaledWidth) / 2;
      const nextOffsetY = (nextCanvas.height - nextCanvas.scaledHeight) / 2;

      const contentPointX =
        (viewport.scrollLeft + anchor.x - currentOffsetX) / zoomRef.current;
      const contentPointY =
        (viewport.scrollTop + anchor.y - currentOffsetY) / zoomRef.current;

      applyZoom(nextZoom);

      requestAnimationFrame(() => {
        viewport.scrollLeft = Math.max(
          0,
          contentPointX * nextZoom + nextOffsetX - anchor.x,
        );
        viewport.scrollTop = Math.max(
          0,
          contentPointY * nextZoom + nextOffsetY - anchor.y,
        );
      });
    },
    [applyZoom, clampZoom, getCanvasSize, viewportRef],
  );

  /** Resets zoom to the initial fit-to-viewport level and scrolls to origin. */
  const resetView = useCallback(() => {
    const viewport = viewportRef.current;
    applyZoom(initialZoomRef.current);

    if (!viewport) return;
    requestAnimationFrame(() => {
      viewport.scrollLeft = 0;
      viewport.scrollTop = 0;
    });
  }, [applyZoom, viewportRef]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onWheel = (event: WheelEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;

      onInteraction?.();
      event.preventDefault();

      const dominant =
        Math.abs(event.deltaY) >= Math.abs(event.deltaX)
          ? event.deltaY
          : event.deltaX;
      const factor =
        dominant < 0 ? 1 + ZOOM_STEP / 2 : 1 / (1 + ZOOM_STEP / 2);
      const rect = viewport.getBoundingClientRect();

      zoomAroundPoint(zoomRef.current * factor, {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    };

    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      viewport.removeEventListener("wheel", onWheel);
    };
  }, [onInteraction, viewportRef, zoomAroundPoint]);

  const displayZoom = Math.round((zoom / (initialZoomRef.current || 1)) * 100);

  return {
    zoom,
    displayZoom,
    contentSize,
    viewportSize,
    measureAndFit,
    resetView,
    zoomAroundPoint,
    zoomRef,
  } as const;
}
