"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import type { ScrollDragState } from "./types";

export function useDragScroll(
  containerRef: RefObject<HTMLDivElement | null>,
) {
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<ScrollDragState>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = dragRef.current;
      const c = containerRef.current;
      if (!d || !c) return;

      e.preventDefault();
      c.scrollLeft = d.startScrollLeft - (e.clientX - d.startPoint.x);
      c.scrollTop = d.startScrollTop - (e.clientY - d.startPoint.y);
    };

    const onUp = () => {
      if (dragRef.current) {
        dragRef.current = null;
        setIsDragging(false);
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [containerRef]);

  const onMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const c = containerRef.current;
    if (!c) return;

    e.preventDefault();
    dragRef.current = {
      startPoint: { x: e.clientX, y: e.clientY },
      startScrollLeft: c.scrollLeft,
      startScrollTop: c.scrollTop,
    };
    setIsDragging(true);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse") return;
    const c = containerRef.current;
    if (!c) return;

    e.preventDefault();
    c.setPointerCapture(e.pointerId);
    dragRef.current = {
      startPoint: { x: e.clientX, y: e.clientY },
      startScrollLeft: c.scrollLeft,
      startScrollTop: c.scrollTop,
    };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    const c = containerRef.current;
    if (!d || !c) return;

    e.preventDefault();
    c.scrollLeft = d.startScrollLeft - (e.clientX - d.startPoint.x);
    c.scrollTop = d.startScrollTop - (e.clientY - d.startPoint.y);
  };

  const onPointerEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    const c = containerRef.current;
    if (c?.hasPointerCapture(e.pointerId)) {
      c.releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
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
