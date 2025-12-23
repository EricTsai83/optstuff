"use client";

import { RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";

/** Circumference of the progress ring (r=14, 2πr ≈ 87.96) */
const RING_CIRCUMFERENCE = 87.96;

type ProgressRingButtonProps = {
  readonly scanProgress: number;
  readonly isOptimized: boolean;
  readonly onRestart: () => void;
};

/**
 * Circular progress indicator that transforms into a replay button.
 *
 * - During scan: shows animated progress ring with pulsing center dot
 * - After optimization: shows replay icon with hover effects
 */
export function ProgressRingButton({
  scanProgress,
  isOptimized,
  onRestart,
}: ProgressRingButtonProps) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
      <button
        type="button"
        onClick={isOptimized ? onRestart : undefined}
        disabled={!isOptimized}
        aria-label={
          isOptimized
            ? "restart animation"
            : `progress ${Math.round(scanProgress)}%`
        }
        className={cn(
          "group relative flex h-8 w-8 items-center justify-center transition-all duration-300",
          isOptimized
            ? [
                "cursor-pointer",
                "hover:scale-110",
                "focus-visible:ring-accent/50 focus-visible:rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:outline-none",
                "active:scale-95",
              ]
            : "cursor-default",
        )}
      >
        <ProgressRingSvg progress={scanProgress} isVisible={!isOptimized} />
        <PulsingDot isVisible={!isOptimized} />
        <CompletedBackground isVisible={isOptimized} />
        <ReplayIcon isVisible={isOptimized} />
      </button>
    </div>
  );
}

type ProgressRingSvgProps = {
  readonly progress: number;
  readonly isVisible: boolean;
};

function ProgressRingSvg({ progress, isVisible }: ProgressRingSvgProps) {
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress / 100);

  return (
    <svg
      className={cn(
        "absolute inset-0 -rotate-90 transition-opacity duration-500",
        isVisible ? "opacity-100" : "opacity-0",
      )}
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      {/* Background ring */}
      <circle
        cx="16"
        cy="16"
        r="14"
        fill="none"
        stroke="rgba(16, 185, 129, 0.15)"
        strokeWidth="2"
      />
      {/* Progress ring */}
      <circle
        cx="16"
        cy="16"
        r="14"
        fill="none"
        stroke="rgba(16, 185, 129, 0.7)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={RING_CIRCUMFERENCE}
        strokeDashoffset={strokeDashoffset}
      />
    </svg>
  );
}

type VisibilityProps = {
  readonly isVisible: boolean;
};

function PulsingDot({ isVisible }: VisibilityProps) {
  return (
    <span
      className={cn(
        "bg-accent/60 absolute h-2 w-2 rounded-full transition-all duration-300",
        isVisible ? "scale-100 animate-pulse opacity-100" : "scale-0 opacity-0",
      )}
    />
  );
}

function CompletedBackground({ isVisible }: VisibilityProps) {
  return (
    <span
      className={cn(
        "bg-accent/15 border-accent/40 absolute inset-0 rounded-full border transition-all duration-300",
        isVisible
          ? "group-hover:border-accent/60 group-hover:bg-accent/20 scale-100 opacity-100 shadow-[0_0_12px_rgba(16,185,129,0.25)] group-hover:shadow-[0_0_20px_rgba(16,185,129,0.35)]"
          : "scale-0 opacity-0",
      )}
    />
  );
}

function ReplayIcon({ isVisible }: VisibilityProps) {
  return (
    <RotateCcw
      className={cn(
        "text-accent relative z-10 h-4 w-4 transition-all duration-300",
        isVisible
          ? "scale-100 opacity-100 group-hover:-rotate-45"
          : "scale-0 opacity-0",
      )}
      strokeWidth={2.5}
      aria-hidden="true"
    />
  );
}
