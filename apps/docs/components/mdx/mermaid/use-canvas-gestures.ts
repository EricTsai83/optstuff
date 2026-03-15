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

export function useCanvasGestures(
  viewportRef: RefObject<HTMLDivElement | null>,
  contentRef: RefObject<HTMLDivElement | null>,
  onInteraction?: () => void,
) {
  const [zoom, setZoom] = useState(1);
  const [displayZoom, setDisplayZoom] = useState(100);
  const [contentSize, setContentSize] = useState<Size>({ width: 1, height: 1 });
  const [viewportSize, setViewportSize] = useState<Size>({
    width: 1,
    height: 1,
  });

  const zoomRef = useRef(1);
  const initialZoomRef = useRef(1);
  const contentSizeRef = useRef<Size>({ width: 1, height: 1 });
  const viewportSizeRef = useRef<Size>({ width: 1, height: 1 });

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

  const syncDisplayZoom = useCallback((nextZoom: number) => {
    const base = initialZoomRef.current || 1;
    setDisplayZoom(Math.round((nextZoom / base) * 100));
  }, []);

  const applyZoom = useCallback(
    (nextZoom: number) => {
      zoomRef.current = nextZoom;
      setZoom(nextZoom);
      syncDisplayZoom(nextZoom);
    },
    [syncDisplayZoom],
  );

  const measureAndFit = useCallback(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;

    const viewportWidth = viewport.clientWidth;
    const viewportHeight = viewport.clientHeight;
    if (!viewportWidth || !viewportHeight) return;

    const svgEl = content.querySelector("svg");
    if (!svgEl) return;

    svgEl.removeAttribute("width");
    svgEl.removeAttribute("height");
    svgEl.style.maxWidth = "none";
    svgEl.style.width = "auto";
    svgEl.style.height = "auto";

    const vb = svgEl.viewBox?.baseVal;
    let width = vb && vb.width > 0 ? vb.width : 0;
    let height = vb && vb.height > 0 ? vb.height : 0;

    if (!width || !height) {
      const rect = svgEl.getBoundingClientRect();
      width = rect.width || svgEl.scrollWidth;
      height = rect.height || svgEl.scrollHeight;
    }

    if (!width || !height) return;

    svgEl.style.width = "100%";
    svgEl.style.height = "100%";
    svgEl.style.maxWidth = "none";
    svgEl.style.margin = "0";
    svgEl.style.display = "block";

    const nextContentSize = { width, height };
    const nextViewportSize = { width: viewportWidth, height: viewportHeight };
    const fitZoom = Math.min(
      MAX_ZOOM,
      viewportWidth / width,
      viewportHeight / height,
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
      const factor = dominant < 0 ? 1 + ZOOM_STEP / 2 : 1 / (1 + ZOOM_STEP / 2);
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
