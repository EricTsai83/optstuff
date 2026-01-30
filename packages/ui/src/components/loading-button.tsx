"use client";

import { Loader2 } from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "@workspace/ui/components/button";

type LoadingButtonProps = ComponentProps<typeof Button> & {
  /** 顯示 loading spinner 並自動禁用按鈕 */
  readonly loading?: boolean;
};

/**
 * 帶有 loading 狀態的 Button 組件
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
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  );
}

export { LoadingButton };
export type { LoadingButtonProps };
