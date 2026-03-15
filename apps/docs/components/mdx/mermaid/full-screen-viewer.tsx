"use client";

import { useEffect, useId, useLayoutEffect, useRef } from "react";
import { ZOOM_STEP } from "./constants";
import { useCanvasGestures } from "./use-canvas-gestures";

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

  const {
    zoom,
    pan,
    isDragging,
    displayZoom,
    measureAndFit,
    resetView,
    zoomAroundPoint,
    zoomRef,
    cleanup,
    handlers,
  } = useCanvasGestures(viewportRef, contentRef);

  useLayoutEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useLayoutEffect(() => {
    measureAndFit();
    window.addEventListener("resize", measureAndFit);

    return () => {
      window.removeEventListener("resize", measureAndFit);
    };
  }, [svgHtml, measureAndFit]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    closeRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      cleanup();
    };
  }, [onClose, cleanup]);

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
              Drag to pan. Scroll to move. Cmd/Ctrl + scroll to zoom.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => zoomAroundPoint(zoomRef.current - ZOOM_STEP)}
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
              onClick={() => zoomAroundPoint(zoomRef.current + ZOOM_STEP)}
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
          className={`relative flex-1 touch-none overflow-hidden ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          ref={viewportRef}
          {...handlers}
        >
          <div className="relative h-full w-full" onDoubleClick={resetView}>
            <div
              className="absolute inset-0 flex items-center justify-center"
            >
              <div
                className="origin-center"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                }}
              >
                <div
                  className="w-max select-none"
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
