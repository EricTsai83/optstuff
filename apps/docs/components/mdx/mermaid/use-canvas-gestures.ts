"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type WheelEvent,
} from "react";
import { MAX_ZOOM, MIN_ZOOM, ORIGIN, ZOOM_STEP } from "./constants";
import { dist, mid, roundZoom } from "./math";
import type { GestureState, MouseDragState, Point, Size } from "./types";

export function useCanvasGestures(
  viewportRef: RefObject<HTMLDivElement | null>,
  contentRef: RefObject<HTMLDivElement | null>,
) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>(ORIGIN);
  const [isDragging, setIsDragging] = useState(false);

  const zoomRef = useRef(1);
  const panRef = useRef<Point>(ORIGIN);
  const fitZoomRef = useRef(1);
  const contentSizeRef = useRef<Size>({ width: 1, height: 1 });

  const pointersRef = useRef(new Map<number, Point>());
  const gestureRef = useRef<GestureState>(null);
  const mouseDragRef = useRef<MouseDragState>(null);

  const clampZoom = useCallback((v: number) => {
    // Keep zoom controls compatible with very large diagrams where fit can be
    // below MIN_ZOOM.
    const minZoom = Math.min(MIN_ZOOM, fitZoomRef.current);
    return Math.min(MAX_ZOOM, Math.max(minZoom, roundZoom(v)));
  }, []);

  const applyView = useCallback((z: number, p: Point) => {
    zoomRef.current = z;
    panRef.current = p;
    setZoom(z);
    setPan(p);
  }, []);

  const measureAndFit = useCallback(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;

    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    if (!vw || !vh) return;

    const svgEl = content.querySelector("svg");
    if (!svgEl) return;

    const transformEl = content.parentElement;
    const prevTransform = transformEl?.style.transform ?? "";
    if (transformEl) transformEl.style.transform = "none";

    svgEl.removeAttribute("width");
    svgEl.removeAttribute("height");
    svgEl.style.maxWidth = "none";
    svgEl.style.width = "auto";
    svgEl.style.height = "auto";

    const vb = svgEl.viewBox?.baseVal;
    let cw = vb && vb.width > 0 ? vb.width : 0;
    let ch = vb && vb.height > 0 ? vb.height : 0;

    if (!cw || !ch) {
      const rect = svgEl.getBoundingClientRect();
      cw = rect.width || svgEl.scrollWidth;
      ch = rect.height || svgEl.scrollHeight;
    }

    if (transformEl) transformEl.style.transform = prevTransform;

    if (!cw || !ch) return;

    svgEl.setAttribute("width", String(cw));
    svgEl.setAttribute("height", String(ch));
    svgEl.style.width = `${cw}px`;
    svgEl.style.height = `${ch}px`;
    svgEl.style.maxWidth = "none";
    svgEl.style.margin = "0";
    svgEl.style.display = "block";

    contentSizeRef.current = { width: cw, height: ch };

    const fitRaw = Math.min(vw / cw, vh / ch);
    const fit = Math.min(MAX_ZOOM, roundZoom(fitRaw));
    fitZoomRef.current = fit;

    applyView(fit, ORIGIN);
  }, [applyView, viewportRef, contentRef]);

  const resetView = useCallback(() => {
    measureAndFit();
  }, [measureAndFit]);

  const zoomAroundPoint = useCallback(
    (nextRaw: number, focal?: Point) => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      const next = clampZoom(nextRaw);
      const center = {
        x: viewport.clientWidth / 2,
        y: viewport.clientHeight / 2,
      };
      const anchor = focal ?? center;
      const local = {
        x: (anchor.x - center.x - panRef.current.x) / zoomRef.current,
        y: (anchor.y - center.y - panRef.current.y) / zoomRef.current,
      };

      applyView(next, {
        x: anchor.x - center.x - local.x * next,
        y: anchor.y - center.y - local.y * next,
      });
    },
    [applyView, clampZoom, viewportRef],
  );

  const displayZoom = Math.round(
    (zoomRef.current / fitZoomRef.current) * 100,
  );

  // --- window-level mouse drag for desktop ---

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const md = mouseDragRef.current;
      if (!md) return;
      e.preventDefault();
      applyView(zoomRef.current, {
        x: md.startPan.x + e.clientX - md.startPoint.x,
        y: md.startPan.y + e.clientY - md.startPoint.y,
      });
    };

    const onUp = () => {
      if (mouseDragRef.current) {
        mouseDragRef.current = null;
        setIsDragging(false);
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [applyView]);

  // --- helpers ---

  const getViewportPoint = (cx: number, cy: number) => {
    const vp = viewportRef.current;
    if (!vp) return null;
    const r = vp.getBoundingClientRect();
    return { x: cx - r.left, y: cy - r.top } satisfies Point;
  };

  const startPan = (point: Point) => {
    gestureRef.current = {
      type: "pan",
      startPoint: point,
      startPan: panRef.current,
    };
  };

  const startPinch = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const [a, b] = Array.from(pointersRef.current.values());
    if (!a || !b) return;
    const m = mid(a, b);
    const center = {
      x: viewport.clientWidth / 2,
      y: viewport.clientHeight / 2,
    };
    gestureRef.current = {
      type: "pinch",
      startDistance: Math.max(dist(a, b), 1),
      startMidpoint: m,
      startZoom: zoomRef.current,
      contentPoint: {
        x: (m.x - center.x - panRef.current.x) / zoomRef.current,
        y: (m.y - center.y - panRef.current.y) / zoomRef.current,
      },
    };
  };

  // --- event handlers (bind to viewport) ---

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse") return;
    const vp = getViewportPoint(e.clientX, e.clientY);
    const el = viewportRef.current;
    if (!vp || !el) return;

    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, vp);

    if (pointersRef.current.size === 1) startPan(vp);
    else if (pointersRef.current.size === 2) startPinch();
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    const vp = getViewportPoint(e.clientX, e.clientY);
    if (!vp) return;

    e.preventDefault();
    pointersRef.current.set(e.pointerId, vp);
    const g = gestureRef.current;

    if (pointersRef.current.size === 1 && g?.type === "pan") {
      applyView(zoomRef.current, {
        x: g.startPan.x + vp.x - g.startPoint.x,
        y: g.startPan.y + vp.y - g.startPoint.y,
      });
      return;
    }

    if (pointersRef.current.size >= 2) {
      if (g?.type !== "pinch") startPinch();
      const ng = gestureRef.current;
      const [a, b] = Array.from(pointersRef.current.values());
      if (ng?.type !== "pinch" || !a || !b) return;

      const m = mid(a, b);
      const viewport = viewportRef.current;
      if (!viewport) return;
      const center = {
        x: viewport.clientWidth / 2,
        y: viewport.clientHeight / 2,
      };
      const nz = clampZoom(
        ng.startZoom * (Math.max(dist(a, b), 1) / ng.startDistance),
      );
      applyView(nz, {
        x: m.x - center.x - ng.contentPoint.x * nz,
        y: m.y - center.y - ng.contentPoint.y * nz,
      });
    }
  };

  const onPointerEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = viewportRef.current;
    if (el?.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
    pointersRef.current.delete(e.pointerId);

    if (pointersRef.current.size >= 2) {
      startPinch();
    } else {
      const remain = Array.from(pointersRef.current.values())[0];
      if (remain) startPan(remain);
      else gestureRef.current = null;
    }
  };

  const onMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    mouseDragRef.current = {
      startPoint: { x: e.clientX, y: e.clientY },
      startPan: panRef.current,
    };
    setIsDragging(true);
  };

  const onWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault();
      const d =
        Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      const step = d < 0 ? ZOOM_STEP : -ZOOM_STEP;
      const fp = getViewportPoint(e.clientX, e.clientY);
      zoomAroundPoint(zoomRef.current + step, fp ?? undefined);
      return;
    }

    e.preventDefault();
    applyView(zoomRef.current, {
      x: panRef.current.x - e.deltaX,
      y: panRef.current.y - e.deltaY,
    });
  };

  const cleanup = useCallback(() => {
    pointersRef.current.clear();
    gestureRef.current = null;
    mouseDragRef.current = null;
    setIsDragging(false);
  }, []);

  return {
    zoom,
    pan,
    isDragging,
    displayZoom,
    measureAndFit,
    resetView,
    zoomAroundPoint,
    zoomRef,
    cleanup,
    handlers: {
      onWheel,
      onMouseDownCapture: onMouseDown,
      onPointerDownCapture: onPointerDown,
      onPointerMoveCapture: onPointerMove,
      onPointerUpCapture: onPointerEnd,
      onPointerCancelCapture: onPointerEnd,
    },
  } as const;
}
