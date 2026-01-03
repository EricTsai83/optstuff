"use client";

import { OPTIMIZATION_HIGHLIGHT_DELAY_MS } from "@/components/hero-animation-parts/constants";
import { HighlightValue } from "@/components/hero-animation-parts/highlight-value";
import { cn } from "@workspace/ui/lib/utils";

type FileInfoPanelProps = {
  readonly currentFormat: string;
  readonly currentSize: number;
  readonly reductionPercent: number;
  readonly isOptimized: boolean;
};

/**
 * Displays file optimization statistics (format, size, savings).
 *
 * Each value uses the {@link HighlightValue} component for sweep-glow
 * animation when optimization completes.
 */
export function FileInfoPanel({
  currentFormat,
  currentSize,
  reductionPercent,
  isOptimized,
}: FileInfoPanelProps) {
  return (
    <div className="absolute right-4 bottom-2.5 flex flex-col items-end gap-1 font-mono text-xs">
      <StatRow label="Format">{currentFormat}</StatRow>
      <StatRow label="Size">{currentSize.toLocaleString()}KB</StatRow>
      <HighlightValue
        isHighlighted={isOptimized}
        delay={OPTIMIZATION_HIGHLIGHT_DELAY_MS}
        className={cn(
          "text-accent text-right text-[10px] font-semibold text-nowrap",
        )}
      >
        Reduced by
        <div
          className={cn(
            "inline-block w-20 text-right text-xs tabular-nums",
            isOptimized && "text-glow-stay delay-500",
          )}
        >
          <span className={cn(isOptimized && "animate-underline-grow")}>
            {reductionPercent > 0 ? `${reductionPercent}` : "0"}% memory
          </span>
        </div>
      </HighlightValue>
    </div>
  );
}

type StatRowProps = {
  readonly label: string;
  readonly children: React.ReactNode;
};

function StatRow({ label, children }: StatRowProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-accent w-18 text-right text-[10px] font-bold tracking-wide uppercase">
        {label}:
      </span>
      <span
        className={cn(
          "text-accent w-12 text-right text-[10px] font-semibold tabular-nums",
        )}
      >
        {children}
      </span>
    </div>
  );
}
