"use client";

import { useCallback, useRef } from "react";
import { Maximize2 } from "lucide-react";
import {
  DIAGRAM_TOOLBAR_PREVIEW_FULLSCREEN_ICON_BUTTON,
  DiagramToolbarButton,
  DiagramViewerToolbar,
} from "./diagram-viewer-toolbar";
import type { BindFunctions } from "./types";
import { useDragScroll } from "./use-drag-scroll";

type DiagramPreviewProps = {
  readonly svgHtml: string;
  readonly onOpenFullScreen: () => void;
  /** Short label for this figure (not the doc page title). */
  readonly title?: string;
  /** Optional note on how to read the diagram; interaction hints belong in full-screen mode. */
  readonly description?: string;
  readonly bindFunctions?: BindFunctions | undefined;
};

/**
 * Inline SVG preview card with drag-to-scroll and a button that opens
 * the full-screen viewer.
 */
export function DiagramPreview({
  svgHtml,
  onOpenFullScreen,
  title = "Diagram",
  description,
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
            label="Open full screen"
            iconOnly
            onClick={onOpenFullScreen}
            icon={
              <Maximize2
                className="size-5 shrink-0 md:size-[18px]"
                aria-hidden
              />
            }
            className={DIAGRAM_TOOLBAR_PREVIEW_FULLSCREEN_ICON_BUTTON}
          />
        }
      />
      <div
        className={`bg-fd-background/70 touch-pan-x touch-pan-y overflow-auto p-3 md:p-4 ${
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
