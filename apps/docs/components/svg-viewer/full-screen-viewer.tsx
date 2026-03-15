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
import { useCanvasGestures } from "./use-canvas-gestures";
import { useDragScroll } from "./use-drag-scroll";

const ACTION_BUTTON_CLASS =
  "border-fd-border hover:bg-fd-muted cursor-pointer rounded-lg border px-3 py-2 transition";
const ZOOM_BUTTON_CLASS = `${ACTION_BUTTON_CLASS} text-lg`;

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
  className = ACTION_BUTTON_CLASS,
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
      window.removeEventListener("wheel", onWheelCapture, true);
    };
  }, [closeRef, onClose]);
}

function useAutoFitContent(
  svgHtml: string,
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

    window.addEventListener("resize", measureIfPristine);

    return () => {
      isCancelled = true;
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      window.removeEventListener("resize", measureIfPristine);
    };
  }, [hasInteractedRef, measureAndFit, svgHtml]);
}

/**
 * Full-screen SVG viewer with drag-to-pan, Cmd/Ctrl + scroll zoom,
 * keyboard shortcuts (Escape to close), and +/- toolbar buttons.
 *
 * @param title       - Modal heading (defaults to "Diagram")
 * @param description - Subtitle hint (defaults to zoom/pan guidance)
 */
export function FullScreenViewer({
  svgHtml,
  onClose,
  title = "Diagram",
  description = "Drag to pan. Scroll to move. Cmd/Ctrl + scroll or +/- to zoom.",
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

  useLockBodyScroll();
  useAutoFitContent(svgHtml, measureAndFit, hasInteractedRef);
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
              {title}
            </p>
            <p className="text-fd-muted-foreground text-md">{description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ToolbarButton
              label="-"
              onClick={() =>
                zoomAroundPoint(zoomRef.current / (1 + ZOOM_STEP))
              }
              className={ZOOM_BUTTON_CLASS}
              ariaLabel="Zoom out diagram"
            />
            <span className="text-fd-muted-foreground w-16 text-center tabular-nums">
              {displayZoom}%
            </span>
            <ToolbarButton
              label="+"
              onClick={() =>
                zoomAroundPoint(zoomRef.current * (1 + ZOOM_STEP))
              }
              className={ZOOM_BUTTON_CLASS}
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
