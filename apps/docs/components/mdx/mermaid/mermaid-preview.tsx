"use client";

import { useRef } from "react";
import { useDragScroll } from "./use-drag-scroll";

type MermaidPreviewProps = {
  readonly svgHtml: string;
  readonly onOpenFullScreen: () => void;
  readonly bindFunctions?: ((el: Element) => void) | undefined;
};

export function MermaidPreview({
  svgHtml,
  onOpenFullScreen,
  bindFunctions,
}: MermaidPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isDragging, handlers } = useDragScroll(containerRef);

  return (
    <div className="border-fd-border bg-fd-card/95 my-6 overflow-hidden rounded-2xl border shadow-sm">
      <div className="border-fd-border flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium">Mermaid Diagram</p>
          <p className="text-fd-muted-foreground text-xs">
            Drag to scroll. Open full screen for zoom controls.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenFullScreen}
          className="border-fd-border bg-fd-background text-fd-foreground hover:bg-fd-muted cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition sm:w-auto"
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
          ref={(el) => {
            if (el) bindFunctions?.(el);
          }}
          dangerouslySetInnerHTML={{ __html: svgHtml }}
        />
      </div>
    </div>
  );
}
