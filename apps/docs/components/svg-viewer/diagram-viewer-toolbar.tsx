"use client";

import { cn } from "@workspace/ui/lib/utils";
import type { ReactNode, RefObject } from "react";

/** Base style for diagram viewer toolbar text buttons (Open full screen, Reset, Close, etc.). */
export const DIAGRAM_TOOLBAR_ACTION_BUTTON =
  "border-fd-border bg-fd-background text-fd-foreground hover:bg-fd-muted active:bg-fd-muted active:scale-95 cursor-pointer rounded-lg border px-3 py-2.5 text-sm font-medium transition md:py-2";

export const DIAGRAM_TOOLBAR_ZOOM_BUTTON = `${DIAGRAM_TOOLBAR_ACTION_BUTTON} flex size-10 items-center justify-center text-base md:size-auto md:px-3 md:py-2 md:text-lg`;

/** Escapes Fumadocs `DocsBody` typography (`.prose`) so nested `p` tags are not given paragraph margins. */
const TOOLBAR_ROW =
  "not-prose border-fd-border flex flex-col gap-1 border-b px-3 py-2 md:flex-row md:items-center md:justify-between md:gap-2 md:px-6 md:py-4";

const TITLE_CLASS = "m-0 truncate text-base font-semibold md:text-lg";

const DESCRIPTION_CLASS =
  "m-0 text-fd-muted-foreground text-xs leading-snug md:text-sm";

const ACTIONS_ROW = "flex flex-wrap items-center gap-1 md:gap-1.5";

/** Inline preview: title block first, then actions full-width below `md`. */
const ACTIONS_ROW_PREVIEW =
  "w-full flex-col items-stretch gap-2 md:w-auto md:flex-row md:flex-wrap md:items-center md:gap-1.5";

type DiagramViewerToolbarProps = {
  readonly title: string;
  readonly description: string;
  /** When set, applied to the title element (e.g. dialog `aria-labelledby`). */
  readonly titleId?: string;
  readonly actions: ReactNode;
  /**
   * `preview` stacks actions under the title below `md` and lets a single
   * primary button span the full content width (see DiagramPreview).
   */
  readonly layout?: "default" | "preview";
};

export function DiagramViewerToolbar({
  title,
  description,
  titleId,
  actions,
  layout = "default",
}: DiagramViewerToolbarProps) {
  return (
    <div
      className={cn(
        TOOLBAR_ROW,
        layout === "preview" && "gap-2",
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <p id={titleId} className={TITLE_CLASS}>
          {title}
        </p>
        <p className={DESCRIPTION_CLASS}>{description}</p>
      </div>
      <div
        className={cn(
          ACTIONS_ROW,
          layout === "preview" && ACTIONS_ROW_PREVIEW,
        )}
      >
        {actions}
      </div>
    </div>
  );
}

type DiagramToolbarButtonProps = {
  readonly label: string;
  readonly onClick: () => void;
  readonly ariaLabel?: string;
  readonly className?: string;
  readonly autoFocusRef?: RefObject<HTMLButtonElement | null>;
};

export function DiagramToolbarButton({
  label,
  onClick,
  ariaLabel,
  className = DIAGRAM_TOOLBAR_ACTION_BUTTON,
  autoFocusRef,
}: DiagramToolbarButtonProps) {
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
