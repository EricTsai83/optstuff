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
import type { ScrollDragState } from "./types";

/**
 * Adds click-and-drag scrolling to an overflow container.
 *
 * Handles both mouse (via global `mousemove`/`mouseup`) and touch/pointer
 * (via React Pointer Events with pointer capture) input.
 *
 * Multi-touch is detected automatically: when a second finger touches down
 * the drag is cancelled so pinch-to-zoom (handled separately) can take over.
 *
 * @returns `isDragging` for cursor styling and `handlers` to spread onto the
 *          scrollable container element.
 */
export function useDragScroll(
  containerRef: RefObject<HTMLDivElement | null>,
) {
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<ScrollDragState>(null);
  const activeTouchCountRef = useRef(0);

  const updateScroll = useCallback(
    (clientX: number, clientY: number) => {
      const dragState = dragRef.current;
      const container = containerRef.current;
      if (!dragState || !container) return;

      container.scrollLeft =
        dragState.startScrollLeft - (clientX - dragState.startPoint.x);
      container.scrollTop =
        dragState.startScrollTop - (clientY - dragState.startPoint.y);
    },
    [containerRef],
  );

  const startDrag = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return;

      dragRef.current = {
        startPoint: { x: clientX, y: clientY },
        startScrollLeft: container.scrollLeft,
        startScrollTop: container.scrollTop,
      };
      setIsDragging(true);
    },
    [containerRef],
  );

  const stopDrag = useCallback(
    (pointerId?: number) => {
      const container = containerRef.current;
      if (
        pointerId !== undefined &&
        container?.hasPointerCapture(pointerId)
      ) {
        container.releasePointerCapture(pointerId);
      }

      if (!dragRef.current) return;

      dragRef.current = null;
      setIsDragging(false);
    },
    [containerRef],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;

      e.preventDefault();
      updateScroll(e.clientX, e.clientY);
    };

    const onUp = () => {
      stopDrag();
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [stopDrag, updateScroll]);

  const onMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;

    e.preventDefault();
    startDrag(e.clientX, e.clientY);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse") return;

    activeTouchCountRef.current++;

    if (activeTouchCountRef.current > 1) {
      dragRef.current = null;
      setIsDragging(false);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    e.preventDefault();
    container.setPointerCapture(e.pointerId);
    startDrag(e.clientX, e.clientY);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" && activeTouchCountRef.current > 1) return;
    if (!dragRef.current) return;

    e.preventDefault();
    updateScroll(e.clientX, e.clientY);
  };

  const onPointerEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") {
      activeTouchCountRef.current = Math.max(
        0,
        activeTouchCountRef.current - 1,
      );
    }
    stopDrag(e.pointerId);
  };

  return {
    isDragging,
    handlers: {
      onMouseDownCapture: onMouseDown,
      onPointerDownCapture: onPointerDown,
      onPointerMoveCapture: onPointerMove,
      onPointerUpCapture: onPointerEnd,
      onPointerCancelCapture: onPointerEnd,
    },
  } as const;
}
