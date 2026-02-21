"use client";

import type { ComponentProps } from "react";

import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

type LoadingButtonProps = ComponentProps<typeof Button> & {
  /** Shows a loading state and automatically disables the button */
  readonly loading?: boolean;
};

/**
 * Button with a smooth loading transition.
 *
 * A spinner slides in from the left when loading starts,
 * and the button width adjusts smoothly via CSS transitions.
 *
 * @example
 * ```tsx
 * <LoadingButton loading={isPending} disabled={!isValid}>
 *   Submit
 * </LoadingButton>
 * ```
 */
function LoadingButton({
  loading = false,
  disabled,
  children,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      disabled={disabled || loading}
      className={cn("transition-all duration-300 ease-out", className)}
      {...props}
    >
      {/* Spinner wrapper: w-0 → w-4 with -ml-2 to cancel parent gap when collapsed */}
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex shrink-0 overflow-hidden transition-all duration-300 ease-out",
          loading ? "w-4 opacity-100" : "-ml-2 w-0 opacity-0",
        )}
      >
        <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent" />
      </span>
      {children}
    </Button>
  );
}

export { LoadingButton };
export type { LoadingButtonProps };
