"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { MAX_ZOOM, MIN_ZOOM, ZOOM_STEP } from "./constants";
import { roundZoom } from "./math";
import type { Point, Size } from "./types";

const DEFAULT_SIZE: Size = { width: 1, height: 1 };
const DOUBLE_TAP_DELAY_MS = 280;
const DOUBLE_TAP_DISTANCE_PX = 24;
const TAP_MAX_MOVEMENT_PX = 12;
const TAP_MAX_DURATION_MS = 250;
const DOUBLE_TAP_ZOOM_FACTOR = 2;
const PAN_START_THRESHOLD_PX = 8;

type ActivePointer = {
  clientX: number;
  clientY: number;
  pointerType: string;
  startPoint: Point;
  startedAt: number;
};

type PanState = {
  pointerId: number;
  startPoint: Point;
  startScrollLeft: number;
  startScrollTop: number;
} | null;

type PinchState = {
  pointerIds: [number, number];
  initialDistance: number;
  initialZoom: number;
} | null;

type PendingTouchPanState = {
  pointerId: number;
} | null;

type PendingPanState = {
  pointerId: number;
  startPoint: Point;
} | null;

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

function pointerDistance(a: ActivePointer, b: ActivePointer) {
  return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
}

function pointerMidpoint(a: ActivePointer, b: ActivePointer): Point {
  return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
}

function pointDistance(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/**
 * Centralized gesture controller for the full-screen SVG viewer.
 *
 * This hook keeps zooming, panning, and pointer tracking inside one state
 * machine so mouse drag, single-finger pan, two-finger pinch, and Cmd/Ctrl +
 * wheel zoom do not compete with separate hooks.
 *
 * Interaction model:
 * - mouse / pen primary pointer: pan
 * - single touch: tap by default, pan after a short movement threshold
 * - two touches: pinch-to-zoom around the gesture midpoint
 * - Cmd/Ctrl + wheel: zoom around the cursor
 * - double-click / double-tap: zoom in when fitted, reset when already zoomed
 *
 * If a pinch gesture ends with one finger still on the screen, the remaining
 * finger seamlessly continues as a pan gesture instead of forcing the user to
 * lift and touch again.
 *
 * @param viewportRef   Scroll container that owns the gesture surface.
 * @param contentRef    Wrapper containing the rendered SVG for measurement.
 * @param onInteraction Optional callback fired on the first manual gesture so
 *                      the caller can skip future auto-fit behavior.
 * @returns Zoom state, measurement helpers, and pointer handlers to spread onto
 *          the viewport element.
 */
export function useViewerGestures(
  viewportRef: RefObject<HTMLDivElement | null>,
  contentRef: RefObject<HTMLDivElement | null>,
  onInteraction?: () => void,
) {
  const [zoom, setZoom] = useState(1);
  const [contentSize, setContentSize] = useState<Size>(DEFAULT_SIZE);
  const [viewportSize, setViewportSize] = useState<Size>(DEFAULT_SIZE);
  const [isDragging, setIsDragging] = useState(false);

  const zoomRef = useRef(1);
  const initialZoomRef = useRef(1);
  const contentSizeRef = useRef<Size>(DEFAULT_SIZE);
  const viewportSizeRef = useRef<Size>(DEFAULT_SIZE);
  const activePointersRef = useRef(new Map<number, ActivePointer>());
  const panRef = useRef<PanState>(null);
  const pinchRef = useRef<PinchState>(null);
  const pendingTouchPanRef = useRef<PendingTouchPanState>(null);
  const pendingPanRef = useRef<PendingPanState>(null);
  const lastTapRef = useRef<{ time: number; point: Point } | null>(null);
  const scrollCommitRafRef = useRef<number | null>(null);
  const pendingScrollRef = useRef<Point | null>(null);

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

  /**
   * Batches scroll writes into a single animation frame so high-frequency pinch
   * updates do not queue multiple stale DOM writes.
   */
  const scheduleScroll = useCallback(
    (left: number, top: number) => {
      pendingScrollRef.current = {
        x: Math.max(0, left),
        y: Math.max(0, top),
      };

      if (scrollCommitRafRef.current !== null) return;

      scrollCommitRafRef.current = window.requestAnimationFrame(() => {
        scrollCommitRafRef.current = null;
        const viewport = viewportRef.current;
        const pendingScroll = pendingScrollRef.current;
        if (!viewport || !pendingScroll) return;

        viewport.scrollLeft = pendingScroll.x;
        viewport.scrollTop = pendingScroll.y;
        pendingScrollRef.current = null;
      });
    },
    [viewportRef],
  );

  const flushPendingScroll = useCallback(() => {
    const pendingScroll = pendingScrollRef.current;
    const viewport = viewportRef.current;
    if (!pendingScroll || !viewport) return;

    if (scrollCommitRafRef.current !== null) {
      window.cancelAnimationFrame(scrollCommitRafRef.current);
      scrollCommitRafRef.current = null;
    }

    viewport.scrollLeft = pendingScroll.x;
    viewport.scrollTop = pendingScroll.y;
    pendingScrollRef.current = null;
  }, [viewportRef]);

  const releasePointerCapture = useCallback(
    (pointerId: number) => {
      const viewport = viewportRef.current;
      if (viewport?.hasPointerCapture(pointerId)) {
        viewport.releasePointerCapture(pointerId);
      }
    },
    [viewportRef],
  );

  const stopPan = useCallback(
    (pointerId?: number) => {
      const currentPan = panRef.current;
      const nextPointerId = pointerId ?? currentPan?.pointerId;

      if (nextPointerId !== undefined) {
        releasePointerCapture(nextPointerId);
      }

      if (!currentPan) return;

      panRef.current = null;
      setIsDragging(false);
    },
    [releasePointerCapture],
  );

  const updatePan = useCallback(
    (clientX: number, clientY: number) => {
      const pan = panRef.current;
      const viewport = viewportRef.current;
      if (!pan || !viewport) return;

      viewport.scrollLeft = pan.startScrollLeft - (clientX - pan.startPoint.x);
      viewport.scrollTop = pan.startScrollTop - (clientY - pan.startPoint.y);
    },
    [viewportRef],
  );

  const startPan = useCallback(
    (pointerId: number, clientX: number, clientY: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      flushPendingScroll();

      panRef.current = {
        pointerId,
        startPoint: { x: clientX, y: clientY },
        startScrollLeft: viewport.scrollLeft,
        startScrollTop: viewport.scrollTop,
      };
      setIsDragging(true);
    },
    [flushPendingScroll, viewportRef],
  );

  const getTouchPointers = useCallback(() => {
    return Array.from(activePointersRef.current.entries()).filter(
      ([, pointer]) => pointer.pointerType === "touch",
    );
  }, []);

  const beginPinch = useCallback(
    (first: [number, ActivePointer], second: [number, ActivePointer]) => {
      pinchRef.current = {
        pointerIds: [first[0], second[0]],
        initialDistance: pointerDistance(first[1], second[1]),
        initialZoom: zoomRef.current,
      };
    },
    [],
  );

  const queueTouchTap = useCallback(
    (point: Point, timeStamp: number) => {
      const lastTap = lastTapRef.current;
      if (
        lastTap &&
        timeStamp - lastTap.time <= DOUBLE_TAP_DELAY_MS &&
        pointDistance(lastTap.point, point) <= DOUBLE_TAP_DISTANCE_PX
      ) {
        lastTapRef.current = null;
        return true;
      }

      lastTapRef.current = { time: timeStamp, point };
      return false;
    },
    [],
  );

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

    scheduleScroll(0, 0);
  }, [applyZoom, contentRef, scheduleScroll, viewportRef]);

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
      const pendingScroll = pendingScrollRef.current;
      const scrollLeft = pendingScroll?.x ?? viewport.scrollLeft;
      const scrollTop = pendingScroll?.y ?? viewport.scrollTop;

      const contentPointX =
        (scrollLeft + anchor.x - currentOffsetX) / zoomRef.current;
      const contentPointY =
        (scrollTop + anchor.y - currentOffsetY) / zoomRef.current;

      applyZoom(nextZoom);

      scheduleScroll(
        contentPointX * nextZoom + nextOffsetX - anchor.x,
        contentPointY * nextZoom + nextOffsetY - anchor.y,
      );
    },
    [applyZoom, clampZoom, getCanvasSize, scheduleScroll, viewportRef],
  );

  /** Resets zoom to the initial fit-to-viewport level and scrolls to origin. */
  const resetView = useCallback(() => {
    const viewport = viewportRef.current;
    applyZoom(initialZoomRef.current);

    if (!viewport) return;
    scheduleScroll(0, 0);
  }, [applyZoom, scheduleScroll, viewportRef]);

  /**
   * Toggles between the fitted view and a closer inspection zoom centered on
   * the interaction point.
   */
  const toggleZoomAtPoint = useCallback(
    (focal?: Point) => {
      const initialZoom = initialZoomRef.current || 1;
      const isZoomedIn = zoomRef.current > initialZoom * 1.05;

      if (isZoomedIn) {
        resetView();
        return;
      }

      zoomAroundPoint(clampZoom(initialZoom * DOUBLE_TAP_ZOOM_FACTOR), focal);
    },
    [clampZoom, resetView, zoomAroundPoint],
  );

  // Desktop: Cmd/Ctrl + scroll-wheel zoom
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

  useEffect(() => {
    return () => {
      const pan = panRef.current;
      if (pan) {
        releasePointerCapture(pan.pointerId);
      }
      if (scrollCommitRafRef.current !== null) {
        window.cancelAnimationFrame(scrollCommitRafRef.current);
      }
      activePointersRef.current.clear();
      panRef.current = null;
      pinchRef.current = null;
      pendingTouchPanRef.current = null;
      pendingPanRef.current = null;
      lastTapRef.current = null;
      pendingScrollRef.current = null;
      scrollCommitRafRef.current = null;
    };
  }, [releasePointerCapture]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    activePointersRef.current.set(event.pointerId, {
      clientX: event.clientX,
      clientY: event.clientY,
      pointerType: event.pointerType,
      startPoint: { x: event.clientX, y: event.clientY },
      startedAt: event.timeStamp,
    });

    if (event.pointerType === "touch") {
      const touches = getTouchPointers();

      if (touches.length === 1) {
        pendingTouchPanRef.current = { pointerId: event.pointerId };
        pinchRef.current = null;
        return;
      }

      if (touches.length >= 2) {
        onInteraction?.();
        event.preventDefault();
        lastTapRef.current = null;
        pendingTouchPanRef.current = null;
        stopPan();
        beginPinch(touches[0]!, touches[1]!);
      }

      return;
    }

    pendingPanRef.current = {
      pointerId: event.pointerId,
      startPoint: { x: event.clientX, y: event.clientY },
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const pointer = activePointersRef.current.get(event.pointerId);
    if (!pointer) return;

    pointer.clientX = event.clientX;
    pointer.clientY = event.clientY;

    const pinch = pinchRef.current;
    if (pinch && pinch.pointerIds.includes(event.pointerId)) {
      const first = activePointersRef.current.get(pinch.pointerIds[0]);
      const second = activePointersRef.current.get(pinch.pointerIds[1]);
      if (!first || !second || !pinch.initialDistance) return;

      event.preventDefault();
      const scale = pointerDistance(first, second) / pinch.initialDistance;
      const mid = pointerMidpoint(first, second);
      const rect = event.currentTarget.getBoundingClientRect();

      zoomAroundPoint(pinch.initialZoom * scale, {
        x: mid.x - rect.left,
        y: mid.y - rect.top,
      });
      return;
    }

    const pendingTouchPan = pendingTouchPanRef.current;
    if (
      event.pointerType === "touch" &&
      pendingTouchPan?.pointerId === event.pointerId
    ) {
      if (
        pointDistance(pointer.startPoint, {
          x: event.clientX,
          y: event.clientY,
        }) < PAN_START_THRESHOLD_PX
      ) {
        return;
      }

      onInteraction?.();
      event.preventDefault();
      lastTapRef.current = null;
      pendingTouchPanRef.current = null;
      event.currentTarget.setPointerCapture(event.pointerId);
      startPan(event.pointerId, event.clientX, event.clientY);
      return;
    }

    const pendingPan = pendingPanRef.current;
    if (pendingPan?.pointerId === event.pointerId) {
      if (
        pointDistance(pendingPan.startPoint, {
          x: event.clientX,
          y: event.clientY,
        }) < PAN_START_THRESHOLD_PX
      ) {
        return;
      }

      onInteraction?.();
      event.preventDefault();
      pendingPanRef.current = null;
      event.currentTarget.setPointerCapture(event.pointerId);
      startPan(event.pointerId, event.clientX, event.clientY);
      return;
    }

    const pan = panRef.current;
    if (!pan || pan.pointerId !== event.pointerId) return;

    event.preventDefault();
    updatePan(event.clientX, event.clientY);
  };

  const onPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const pointer = activePointersRef.current.get(event.pointerId);
    if (!pointer) return;

    const wasCancelled = event.type === "pointercancel";
    const pinch = pinchRef.current;
    const wasPinchPointer = pinch?.pointerIds.includes(event.pointerId) ?? false;
    const wasPendingTouchPan =
      pendingTouchPanRef.current?.pointerId === event.pointerId;
    const wasPendingPan = pendingPanRef.current?.pointerId === event.pointerId;

    activePointersRef.current.delete(event.pointerId);
    if (wasPendingTouchPan) {
      pendingTouchPanRef.current = null;
    }
    if (wasPendingPan) {
      pendingPanRef.current = null;
    }

    const pan = panRef.current;
    if (pan?.pointerId === event.pointerId) {
      stopPan(event.pointerId);
    } else {
      releasePointerCapture(event.pointerId);
    }

    if (wasCancelled) {
      if (wasPinchPointer) {
        pinchRef.current = null;
      }
      lastTapRef.current = null;
      return;
    }

    if (wasPinchPointer) {
      const touches = getTouchPointers();
      if (touches.length >= 2) {
        beginPinch(touches[0]!, touches[1]!);
        return;
      }

      pinchRef.current = null;
      if (touches.length === 1) {
        const [remainingPointerId, remainingPointer] = touches[0]!;
        pendingTouchPanRef.current = null;
        event.currentTarget.setPointerCapture(remainingPointerId);
        startPan(
          remainingPointerId,
          remainingPointer.clientX,
          remainingPointer.clientY,
        );
        return;
      }

      return;
    }

    const endPoint = { x: event.clientX, y: event.clientY };
    const wasTap =
      event.pointerType === "touch" &&
      event.timeStamp - pointer.startedAt <= TAP_MAX_DURATION_MS &&
      pointDistance(pointer.startPoint, endPoint) <= TAP_MAX_MOVEMENT_PX;

    if (!wasTap) {
      lastTapRef.current = null;
      return;
    }

    if (!queueTouchTap(endPoint, event.timeStamp)) return;

    onInteraction?.();
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    toggleZoomAtPoint({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  const onDoubleClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    onInteraction?.();
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    toggleZoomAtPoint({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  const displayZoom = Math.round((zoom / (initialZoomRef.current || 1)) * 100);

  return {
    zoom,
    displayZoom,
    contentSize,
    viewportSize,
    isDragging,
    measureAndFit,
    resetView,
    zoomAroundPoint,
    zoomRef,
    handlers: {
      onDoubleClickCapture: onDoubleClick,
      onPointerDownCapture: onPointerDown,
      onPointerMoveCapture: onPointerMove,
      onPointerUpCapture: onPointerEnd,
      onPointerCancelCapture: onPointerEnd,
    },
  } as const;
}
