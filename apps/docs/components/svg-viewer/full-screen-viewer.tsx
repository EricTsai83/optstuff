"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  type RefObject,
} from "react";
import { ZOOM_STEP } from "./constants";
import type { BindFunctions } from "./types";
import { useViewerGestures } from "./use-viewer-gestures";

const ACTION_BUTTON =
  "border-fd-border hover:bg-fd-muted active:bg-fd-muted active:scale-95 cursor-pointer rounded-lg border text-sm transition";
const ZOOM_BUTTON = `${ACTION_BUTTON} flex size-10 items-center justify-center text-base sm:size-auto sm:px-3 sm:py-2 sm:text-lg`;

type FullScreenViewerProps = {
  readonly svgHtml: string;
  readonly onClose: () => void;
  readonly title?: string;
  readonly description?: string;
  readonly bindFunctions?: BindFunctions | undefined;
};

type ToolbarButtonProps = {
  readonly label: string;
  readonly onClick: () => void;
  readonly ariaLabel?: string;
  readonly className?: string;
  readonly autoFocusRef?: RefObject<HTMLButtonElement | null>;
};

function ToolbarButton({
  label,
  onClick,
  ariaLabel,
  className = `${ACTION_BUTTON} px-3 py-2.5 sm:py-2`,
  autoFocusRef,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      ref={autoFocusRef}
      onClick={onClick}
      className={className}
      aria-label={ariaLabel}
    >
      {label}
    </button>
  );
}

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
 * @param title       - Modal heading (defaults to "Diagram")
 * @param description - Subtitle hint (defaults to universal zoom/pan guidance)
 */
export function FullScreenViewer({
  svgHtml,
  onClose,
  title = "Diagram",
  description = "Drag to pan · Pinch or use +/- to zoom",
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
      className="z-100 fixed inset-0 bg-black/70 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={modalId}
      onClick={onClose}
    >
      <div
        className="bg-fd-background sm:border-fd-border mx-auto flex h-full w-full max-w-7xl flex-col overflow-hidden shadow-2xl sm:rounded-2xl sm:border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div className="border-fd-border flex flex-col gap-2 border-b px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4 sm:py-3">
          <div className="min-w-0">
            <p
              id={modalId}
              className="truncate text-base font-medium sm:text-lg"
            >
              {title}
            </p>
            <p className="text-fd-muted-foreground text-xs sm:text-sm">
              {description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <ToolbarButton
              label="-"
              onClick={() => zoomAroundPoint(zoomRef.current / (1 + ZOOM_STEP))}
              className={ZOOM_BUTTON}
              ariaLabel="Zoom out diagram"
            />
            <span className="text-fd-muted-foreground w-12 text-center text-xs tabular-nums sm:w-16 sm:text-sm">
              {displayZoom}%
            </span>
            <ToolbarButton
              label="+"
              onClick={() => zoomAroundPoint(zoomRef.current * (1 + ZOOM_STEP))}
              className={ZOOM_BUTTON}
              ariaLabel="Zoom in diagram"
            />
            <ToolbarButton label="Reset" onClick={resetView} />
            <ToolbarButton
              label="Close"
              onClick={onClose}
              autoFocusRef={closeRef}
            />
          </div>
        </div>

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
