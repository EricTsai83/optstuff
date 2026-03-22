"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  type RefObject,
} from "react";
import {
  DiagramToolbarButton,
  DiagramViewerToolbar,
  DIAGRAM_TOOLBAR_ZOOM_BUTTON,
} from "./diagram-viewer-toolbar";
import { ZOOM_STEP } from "./constants";
import type { BindFunctions } from "./types";
import { useViewerGestures } from "./use-viewer-gestures";

type FullScreenViewerProps = {
  readonly svgHtml: string;
  readonly onClose: () => void;
  readonly title?: string;
  readonly description?: string;
  readonly bindFunctions?: BindFunctions | undefined;
};

function useLockBodyScroll() {
  useLayoutEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);
}

function useViewerShortcuts(
  onClose: () => void,
  closeRef: RefObject<HTMLButtonElement | null>,
) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const onWheelCapture = (event: WheelEvent) => {
      if (event.metaKey || event.ctrlKey) {
        event.preventDefault();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("wheel", onWheelCapture, {
      passive: false,
      capture: true,
    });
    closeRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("wheel", onWheelCapture, {
        capture: true,
      });
    };
  }, [closeRef, onClose]);
}

function useAutoFitContent(
  svgHtml: string,
  viewportRef: RefObject<HTMLDivElement | null>,
  measureAndFit: () => void,
  hasInteractedRef: RefObject<boolean>,
) {
  useLayoutEffect(() => {
    hasInteractedRef.current = false;

    const measureIfPristine = () => {
      if (!hasInteractedRef.current) {
        measureAndFit();
      }
    };

    measureIfPristine();
    const raf1 = window.requestAnimationFrame(measureIfPristine);
    const raf2 = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(measureIfPristine);
    });

    let isCancelled = false;
    if ("fonts" in document) {
      void document.fonts.ready.then(() => {
        if (!isCancelled) {
          measureIfPristine();
        }
      });
    }

    const viewport = viewportRef.current;
    let resizeObserver: ResizeObserver | null = null;
    if (viewport && "ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(measureIfPristine);
      resizeObserver.observe(viewport);
    } else {
      window.addEventListener("resize", measureIfPristine);
    }

    return () => {
      isCancelled = true;
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measureIfPristine);
    };
  }, [hasInteractedRef, measureAndFit, svgHtml, viewportRef]);
}

/**
 * Full-screen SVG viewer with drag-to-pan, pinch-to-zoom, double-click /
 * double-tap zoom toggling, Cmd/Ctrl + scroll zoom, keyboard shortcuts
 * (Escape to close), and +/- toolbar buttons.
 *
 * @param title       - Short figure title in the modal (defaults to "Diagram")
 * @param description - Interaction hint (defaults to universal zoom/pan guidance)
 */
export function FullScreenViewer({
  svgHtml,
  onClose,
  title = "Diagram",
  description = "Drag to pan · Pinch, ⌘/Ctrl + scroll, or +/- to zoom",
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
    isDragging,
    measureAndFit,
    resetView,
    zoomAroundPoint,
    zoomRef,
    handlers,
  } = useViewerGestures(viewportRef, contentRef, markInteracted);

  const canvasWidth = Math.max(viewportSize.width, contentSize.width * zoom);
  const canvasHeight = Math.max(viewportSize.height, contentSize.height * zoom);

  useLockBodyScroll();
  useAutoFitContent(svgHtml, viewportRef, measureAndFit, hasInteractedRef);
  useViewerShortcuts(onClose, closeRef);

  const assignContentRef = useCallback(
    (element: HTMLDivElement | null) => {
      contentRef.current = element;
      if (element) {
        bindFunctions?.(element);
      }
    },
    [bindFunctions],
  );

  return (
    <div
      className="z-100 fixed inset-0 bg-black/70 backdrop-blur-sm md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={modalId}
      onClick={onClose}
    >
      <div
        className="not-prose bg-fd-background md:border-fd-border mx-auto flex h-full w-full max-w-7xl flex-col overflow-hidden shadow-2xl md:rounded-2xl md:border"
        onClick={(e) => e.stopPropagation()}
      >
        <DiagramViewerToolbar
          titleId={modalId}
          title={title}
          description={description}
          actions={
            <>
              <DiagramToolbarButton
                label="-"
                onClick={() =>
                  zoomAroundPoint(zoomRef.current / (1 + ZOOM_STEP))
                }
                className={DIAGRAM_TOOLBAR_ZOOM_BUTTON}
                ariaLabel="Zoom out diagram"
              />
              <span className="text-fd-muted-foreground w-12 text-center text-xs tabular-nums md:w-16 md:text-sm">
                {displayZoom}%
              </span>
              <DiagramToolbarButton
                label="+"
                onClick={() =>
                  zoomAroundPoint(zoomRef.current * (1 + ZOOM_STEP))
                }
                className={DIAGRAM_TOOLBAR_ZOOM_BUTTON}
                ariaLabel="Zoom in diagram"
              />
              <DiagramToolbarButton label="Reset" onClick={resetView} />
              <DiagramToolbarButton
                label="Close"
                onClick={onClose}
                autoFocusRef={closeRef}
              />
            </>
          }
        />

        {/* Zoomable viewport */}
        <div
          className={`relative flex-1 touch-none overflow-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          ref={viewportRef}
          {...handlers}
        >
          <div
            className="relative min-h-full min-w-full"
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
                  ref={assignContentRef}
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
