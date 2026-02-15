"use client";

import { Loader2 } from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

type LoadingButtonProps = ComponentProps<typeof Button> & {
  /** 顯示 loading spinner 並自動禁用按鈕 */
  readonly loading?: boolean;
};

/**
 * 帶有 loading 狀態的 Button 組件。
 *
 * 使用 overlay 技術：loading 時 children 變透明但仍佔據空間，
 * spinner 以 absolute 定位疊在中央，避免 layout shift。
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
      className={cn("relative", className)}
      {...props}
    >
      <span
        className={cn(
          "inline-flex items-center gap-2 transition-opacity",
          loading && "opacity-0",
        )}
      >
        {children}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="size-4 animate-spin" />
        </span>
      )}
    </Button>
  );
}

export { LoadingButton };
export type { LoadingButtonProps };
