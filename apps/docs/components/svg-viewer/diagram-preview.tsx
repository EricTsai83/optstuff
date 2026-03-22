"use client";

import { cn } from "@workspace/ui/lib/utils";
import { useCallback, useRef } from "react";
import {
  DiagramToolbarButton,
  DiagramViewerToolbar,
  DIAGRAM_TOOLBAR_ACTION_BUTTON,
} from "./diagram-viewer-toolbar";
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
    <div className="not-prose border-fd-border bg-fd-card/95 my-4 overflow-hidden rounded-xl border shadow-sm md:my-6 md:rounded-2xl">
      <DiagramViewerToolbar
        layout="preview"
        title={title}
        description={description}
        actions={
          <DiagramToolbarButton
            label="Open Full Screen"
            onClick={onOpenFullScreen}
            className={cn(DIAGRAM_TOOLBAR_ACTION_BUTTON, "w-full md:w-auto")}
          />
        }
      />
      <div
        className={`bg-fd-background/70 touch-pan-x touch-pan-y overflow-auto p-2 md:p-4 ${
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
