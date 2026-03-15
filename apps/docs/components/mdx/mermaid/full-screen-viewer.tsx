"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef } from "react";
import { ZOOM_STEP } from "./constants";
import { useCanvasGestures } from "./use-canvas-gestures";
import { useDragScroll } from "./use-drag-scroll";

type FullScreenViewerProps = {
  readonly svgHtml: string;
  readonly onClose: () => void;
  readonly bindFunctions?: ((el: Element) => void) | undefined;
};

export function FullScreenViewer({
  svgHtml,
  onClose,
  bindFunctions,
}: FullScreenViewerProps) {
  const modalId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const hasInteractedRef = useRef(false);

  const markInteracted = useCallback(() => {
    hasInteractedRef.current = true;
  }, []);

  const {
    zoom,
    displayZoom,
    contentSize,
    viewportSize,
    measureAndFit,
    resetView,
    zoomAroundPoint,
    zoomRef,
  } = useCanvasGestures(viewportRef, contentRef, markInteracted);
  const { isDragging, handlers } = useDragScroll(viewportRef);

  const canvasWidth = Math.max(viewportSize.width, contentSize.width * zoom);
  const canvasHeight = Math.max(viewportSize.height, contentSize.height * zoom);

  useLayoutEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useLayoutEffect(() => {
    hasInteractedRef.current = false;
    measureAndFit();
    const safeMeasureAndFit = () => {
      if (!hasInteractedRef.current) {
        measureAndFit();
      }
    };

    const raf1 = window.requestAnimationFrame(safeMeasureAndFit);
    const raf2 = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(safeMeasureAndFit);
    });

    let cancelled = false;
    if ("fonts" in document) {
      void document.fonts.ready.then(() => {
        if (!cancelled && !hasInteractedRef.current) {
          measureAndFit();
        }
      });
    }

    window.addEventListener("resize", safeMeasureAndFit);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      window.removeEventListener("resize", safeMeasureAndFit);
    };
  }, [svgHtml, measureAndFit]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const onWheelCapture = (e: WheelEvent) => {
      // Prevent browser/page zoom while modal is open; diagram zoom is handled
      // inside the viewport with a dedicated wheel listener.
      if (e.metaKey || e.ctrlKey) e.preventDefault();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("wheel", onWheelCapture, {
      passive: false,
      capture: true,
    });
    closeRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("wheel", onWheelCapture, true);
    };
  }, [onClose]);

  return (
    <div
      className="z-100 fixed inset-0 bg-black/70 p-2 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={modalId}
      onClick={onClose}
    >
      <div
        className="border-fd-border bg-fd-background mx-auto flex h-full w-full max-w-7xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-fd-border flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p id={modalId} className="text-lg font-medium">
              Mermaid Diagram
            </p>
            <p className="text-fd-muted-foreground text-md">
              Drag to pan. Scroll to move. Cmd/Ctrl + scroll or +/- to zoom.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => zoomAroundPoint(zoomRef.current / (1 + ZOOM_STEP))}
              className="border-fd-border hover:bg-fd-muted cursor-pointer rounded-lg border px-3 py-2 text-lg transition"
              aria-label="Zoom out diagram"
            >
              -
            </button>
            <span className="text-fd-muted-foreground w-16 text-center tabular-nums">
              {displayZoom}%
            </span>
            <button
              type="button"
              onClick={() => zoomAroundPoint(zoomRef.current * (1 + ZOOM_STEP))}
              className="border-fd-border hover:bg-fd-muted cursor-pointer rounded-lg border px-3 py-2 text-lg transition"
              aria-label="Zoom in diagram"
            >
              +
            </button>
            <button
              type="button"
              onClick={resetView}
              className="border-fd-border hover:bg-fd-muted cursor-pointer rounded-lg border px-3 py-2 transition"
            >
              Reset
            </button>
            <button
              type="button"
              ref={closeRef}
              onClick={onClose}
              className="border-fd-border hover:bg-fd-muted cursor-pointer rounded-lg border px-3 py-2 transition"
            >
              Close
            </button>
          </div>
        </div>
        <div
          className={`relative flex-1 touch-none overflow-auto overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          ref={viewportRef}
          {...handlers}
        >
          <div
            className="relative min-h-full min-w-full"
            onDoubleClick={resetView}
          >
            <div
              className="flex items-center justify-center"
              style={{
                width: `${canvasWidth}px`,
                height: `${canvasHeight}px`,
              }}
            >
              <div
                className="relative shrink-0 select-none"
                style={{
                  width: `${contentSize.width}px`,
                  height: `${contentSize.height}px`,
                  transform: `scale(${zoom})`,
                  transformOrigin: "center center",
                }}
              >
                <div
                  className="h-full w-full"
                  onDragStart={(e) => e.preventDefault()}
                  ref={(el) => {
                    contentRef.current = el;
                    if (el) bindFunctions?.(el);
                  }}
                  dangerouslySetInnerHTML={{ __html: svgHtml }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
