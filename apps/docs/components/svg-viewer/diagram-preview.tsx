"use client";

import { useCallback, useRef } from "react";
import type { BindFunctions } from "./types";
import { useDragScroll } from "./use-drag-scroll";

const OPEN_BUTTON_CLASS =
  "border-fd-border bg-fd-background text-fd-foreground hover:bg-fd-muted cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition sm:w-auto";

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
 * @param description - Subtitle hint (defaults to drag/zoom guidance)
 */
export function DiagramPreview({
  svgHtml,
  onOpenFullScreen,
  title = "Diagram",
  description = "Drag to scroll. Open full screen for zoom controls.",
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
    <div className="border-fd-border bg-fd-card/95 my-6 overflow-hidden rounded-2xl border shadow-sm">
      <div className="border-fd-border flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-fd-muted-foreground text-xs">{description}</p>
        </div>
        <button
          type="button"
          onClick={onOpenFullScreen}
          className={OPEN_BUTTON_CLASS}
        >
          Open Full Screen
        </button>
      </div>
      <div
        className={`bg-fd-background/70 overflow-auto p-3 sm:p-4 ${
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
