"use client";

import { cn } from "@workspace/ui/lib/utils";

type UsageProgressBarProps = {
  readonly label: string;
  readonly used: number;
  readonly total: number;
  readonly format: (value: number) => string;
  /** Show percentage text below the bar */
  readonly showPercentage?: boolean;
  /** Compact variant for sidebar/mobile use */
  readonly compact?: boolean;
};

export function UsageProgressBar({
  label,
  used,
  total,
  format,
  showPercentage = false,
  compact = false,
}: UsageProgressBarProps) {
  const safePercentage = total <= 0 ? 0 : Math.min((used / total) * 100, 100);
  const isWarning = safePercentage > 80;
  const isDanger = safePercentage > 95;

  const barColor = isDanger
    ? "bg-red-500"
    : isWarning
      ? "bg-yellow-500"
      : "bg-green-500";

  return (
    <div className={cn("space-y-1.5", compact && "space-y-1")}>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {compact && <div className={cn("h-2 w-2 rounded-full", barColor)} />}
          <span className={cn(compact ? "text-foreground" : "font-medium")}>
            {label}
          </span>
        </div>
        <span className="text-muted-foreground">
          {format(used)} / {format(total)}
        </span>
      </div>
      <div
        className={cn(
          "bg-muted overflow-hidden rounded-full",
          compact ? "h-1.5" : "h-2",
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            barColor,
          )}
          style={{ width: `${safePercentage}%` }}
        />
      </div>
      {showPercentage && (
        <p className="text-muted-foreground text-xs">
          {safePercentage.toFixed(1)}% used
        </p>
      )}
    </div>
  );
}

type UsageProgressBarSkeletonProps = {
  readonly compact?: boolean;
};

export function UsageProgressBarSkeleton({
  compact = false,
}: UsageProgressBarSkeletonProps) {
  return (
    <div className={cn("space-y-1.5", compact && "space-y-1")}>
      <div className="bg-muted h-4 w-full animate-pulse rounded" />
      <div
        className={cn(
          "bg-muted animate-pulse rounded-full",
          compact ? "h-1.5" : "h-2",
        )}
      />
    </div>
  );
}
