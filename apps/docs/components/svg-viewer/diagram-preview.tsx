"use client";

import { useCallback, useRef } from "react";
import type { BindFunctions } from "./types";
import { useDragScroll } from "./use-drag-scroll";

type DiagramPreviewProps = {
  readonly svgHtml: string;
  readonly onOpenFullScreen: () => void;
  readonly title?: string;
  readonly description?: string;
  readonly bindFunctions?: BindFunctions | undefined;
};

/**
 * Inline SVG preview card with drag-to-scroll and a button that opens
 * the full-screen viewer.
 *
 * @param title       - Header text (defaults to "Diagram")
 * @param description - Subtitle hint (defaults to scroll/zoom guidance)
 */
export function DiagramPreview({
  svgHtml,
  onOpenFullScreen,
  title = "Diagram",
  description = "Scroll to explore · Open full screen for zoom",
  bindFunctions,
}: DiagramPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isDragging, handlers } = useDragScroll(containerRef);
  const assignContentRef = useCallback(
    (element: HTMLDivElement | null) => {
      if (element) {
        bindFunctions?.(element);
      }
    },
    [bindFunctions],
  );

  return (
    <div className="border-fd-border bg-fd-card/95 my-4 overflow-hidden rounded-xl border shadow-sm sm:my-6 sm:rounded-2xl">
      <div className="border-fd-border flex flex-col gap-2 border-b px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4 sm:py-4">
        <div className="min-w-0 space-y-0.5">
          <p className="truncate text-sm font-medium">{title}</p>
          <p className="text-fd-muted-foreground text-xs">{description}</p>
        </div>
        <button
          type="button"
          onClick={onOpenFullScreen}
          className="border-fd-border bg-fd-background text-fd-foreground hover:bg-fd-muted active:bg-fd-muted active:scale-95 cursor-pointer rounded-lg border px-3 py-2.5 text-sm font-medium transition sm:w-auto sm:py-2"
        >
          Open Full Screen
        </button>
      </div>
      <div
        className={`bg-fd-background/70 touch-pan-x touch-pan-y overflow-auto p-2 sm:p-4 ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        ref={containerRef}
        {...handlers}
      >
        <div
          className="mx-auto min-w-max select-none"
          onDragStart={(e) => e.preventDefault()}
          ref={assignContentRef}
          dangerouslySetInnerHTML={{ __html: svgHtml }}
        />
      </div>
    </div>
  );
}
