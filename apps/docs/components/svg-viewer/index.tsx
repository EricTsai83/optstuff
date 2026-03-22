"use client";

import { useRef, useState } from "react";
import { FULL_SCREEN_CONTROLS_HINT } from "./constants";
import { DiagramPreview } from "./diagram-preview";
import { FullScreenViewer } from "./full-screen-viewer";
import type { BindFunctions } from "./types";

export type SvgViewerProps = {
  /** Raw SVG markup to render. */
  readonly svgHtml: string;
  /** Short figure title in the toolbar (not the MDX page `title` in frontmatter). */
  readonly title?: string;
  /** Optional preview subtitle: how to read this figure; omit if the prose already explains it. */
  readonly previewDescription?: string;
  /** Full-screen subtitle (defaults to zoom/pan guidance). */
  readonly fullScreenDescription?: string;
  /** Post-render callback that wires up interactive elements inside the SVG. */
  readonly bindFunctions?: BindFunctions | undefined;
};

/**
 * All-in-one SVG viewer with an inline preview and a full-screen modal.
 *
 * The inline preview supports drag-to-scroll. The full-screen modal adds
 * focal-point zoom, Cmd/Ctrl + scroll, +/- buttons, keyboard shortcuts,
 * and double-click to reset.
 *
 * @example
 * ```tsx
 * <SvgViewer svgHtml={svgString} title="Architecture Diagram" />
 * ```
 */
export function SvgViewer({
  svgHtml,
  title,
  previewDescription,
  fullScreenDescription,
  bindFunctions,
}: SvgViewerProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  const openFullScreen = () => {
    const el = document.activeElement;
    prevFocusRef.current = el instanceof HTMLElement ? el : null;
    setIsFullScreen(true);
  };

  const closeFullScreen = () => {
    setIsFullScreen(false);
    prevFocusRef.current?.focus();
  };

  const fullScreenToolbarDescription =
    fullScreenDescription ??
    (previewDescription
      ? `${previewDescription} · ${FULL_SCREEN_CONTROLS_HINT}`
      : undefined);

  return (
    <>
      <DiagramPreview
        svgHtml={svgHtml}
        title={title}
        description={previewDescription}
        onOpenFullScreen={openFullScreen}
        bindFunctions={bindFunctions}
      />

      {isFullScreen ? (
        <FullScreenViewer
          svgHtml={svgHtml}
          title={title}
          description={fullScreenToolbarDescription}
          onClose={closeFullScreen}
          bindFunctions={bindFunctions}
        />
      ) : null}
    </>
  );
}

export { DiagramPreview } from "./diagram-preview";
export { FullScreenViewer } from "./full-screen-viewer";
export { useCanvasGestures } from "./use-canvas-gestures";
export { useDragScroll } from "./use-drag-scroll";
export { useViewerGestures } from "./use-viewer-gestures";
export type { BindFunctions, Point, Size } from "./types";
