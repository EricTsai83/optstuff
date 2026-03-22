"use client";

import { cn } from "@workspace/ui/lib/utils";
import type { ReactNode, RefObject } from "react";

/** Base style for diagram viewer toolbar text buttons (Open full screen, Reset, Close, etc.). */
export const DIAGRAM_TOOLBAR_ACTION_BUTTON =
  "border-fd-border bg-fd-background text-fd-foreground hover:bg-fd-muted active:bg-fd-muted active:scale-95 cursor-pointer rounded-lg border px-3 py-2.5 text-sm font-medium transition md:py-2";

/** Compact primary icon control for inline preview — opens full-screen diagram viewer. */
export const DIAGRAM_TOOLBAR_PREVIEW_FULLSCREEN_ICON_BUTTON =
  "inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-fd-border bg-fd-popover text-fd-primary hover:bg-fd-primary/10 active:scale-95 cursor-pointer transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:ring-offset-2 focus-visible:ring-offset-fd-card md:size-9 dark:border-transparent dark:bg-fd-primary dark:text-fd-primary-foreground dark:hover:bg-fd-primary/92";

export const DIAGRAM_TOOLBAR_ZOOM_BUTTON = `${DIAGRAM_TOOLBAR_ACTION_BUTTON} flex size-10 items-center justify-center text-base md:size-auto md:px-3 md:py-2 md:text-lg`;

/** Escapes Fumadocs `DocsBody` typography (`.prose`) so nested `p` tags are not given paragraph margins. */
const TOOLBAR_ROW_BASE =
  "not-prose border-fd-border border-b px-3 md:px-6";

const TOOLBAR_ROW_DEFAULT = cn(
  TOOLBAR_ROW_BASE,
  "flex flex-col gap-1 py-2 md:flex-row md:items-center md:justify-between md:gap-2 md:py-4",
);

/** Inline preview: one header row on mobile (title + action), vertically centered. */
const TOOLBAR_ROW_PREVIEW = cn(
  TOOLBAR_ROW_BASE,
  "flex flex-row items-center justify-between gap-3 py-3 md:gap-2 md:py-4",
);

const DESCRIPTION_CLASS =
  "m-0 text-fd-muted-foreground text-xs leading-snug md:text-sm";

const ACTIONS_ROW = "flex flex-wrap items-center gap-1 md:gap-1.5";

/** Inline preview: keep the icon control from shrinking. */
const ACTIONS_ROW_PREVIEW = "shrink-0";

type DiagramViewerToolbarProps = {
  readonly title: string;
  /** Optional subtitle (e.g. how to read the figure); omit to hide the row. */
  readonly description?: string;
  /** When set, applied to the title element (e.g. dialog `aria-labelledby`). */
  readonly titleId?: string;
  readonly actions: ReactNode;
  /** `preview` uses a compact header row on small screens (see DiagramPreview). */
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
      className={layout === "preview" ? TOOLBAR_ROW_PREVIEW : TOOLBAR_ROW_DEFAULT}
    >
      <div
        className={cn(
          "flex min-w-0 flex-col gap-0.5",
          layout === "preview" && "min-w-0 flex-1 pr-1",
        )}
      >
        <p
          id={titleId}
          className={cn(
            "m-0 font-semibold",
            layout === "preview"
              ? "text-lg leading-snug md:text-xl md:leading-tight line-clamp-2 min-w-0 wrap-break-word md:line-clamp-none md:truncate"
              : "text-base md:text-lg truncate",
          )}
        >
          {title}
        </p>
        {description ? (
          <p className={DESCRIPTION_CLASS}>{description}</p>
        ) : null}
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
  /** Optional icon shown before the label (e.g. full-screen affordance). */
  readonly icon?: ReactNode;
  /** Icon-only control; uses `ariaLabel` or `label` for `aria-label`. */
  readonly iconOnly?: boolean;
};

export function DiagramToolbarButton({
  label,
  onClick,
  ariaLabel,
  className = DIAGRAM_TOOLBAR_ACTION_BUTTON,
  autoFocusRef,
  icon,
  iconOnly = false,
}: DiagramToolbarButtonProps) {
  const accessibleName = ariaLabel ?? label;
  return (
    <button
      type="button"
      ref={autoFocusRef}
      onClick={onClick}
      className={cn(
        (icon || iconOnly) && "inline-flex items-center justify-center gap-2",
        className,
      )}
      aria-label={iconOnly ? accessibleName : ariaLabel}
    >
      {icon}
      {iconOnly ? null : label}
    </button>
  );
}
