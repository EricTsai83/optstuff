"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@workspace/ui/lib/utils";

// =============================================================================
// Types
// =============================================================================

type ImageFormat = "WebP" | "AVIF" | "JPEG" | "PNG";

type FormatColors = {
  readonly primary: string;
  readonly bg: string;
  readonly color: string;
};

type ImageOptimizationCardProps = {
  readonly format?: ImageFormat;
  readonly originalSize?: number;
  readonly className?: string;
};

// =============================================================================
// Constants
// =============================================================================

const ANIMATION_DURATION_MS = 2400;
const PAUSE_DURATION_MS = 1000;
const COMPRESSION_RATIO = 0.7;

const FORMAT_COLORS: Record<ImageFormat, FormatColors> = {
  WebP: { primary: "text-emerald-400", bg: "bg-emerald-500", color: "#10b981" },
  AVIF: { primary: "text-violet-400", bg: "bg-violet-500", color: "#8b5cf6" },
  JPEG: { primary: "text-amber-400", bg: "bg-amber-500", color: "#f59e0b" },
  PNG: { primary: "text-sky-400", bg: "bg-sky-500", color: "#0ea5e9" },
} as const;

// =============================================================================
// Hooks
// =============================================================================

function useLoopingProgress(): number {
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const isPausedRef = useRef(false);

  useEffect(() => {
    let rafId: number;

    const animate = (timestamp: number): void => {
      startTimeRef.current ??= timestamp;
      const elapsed = timestamp - startTimeRef.current;

      if (isPausedRef.current) {
        if (elapsed >= PAUSE_DURATION_MS) {
          isPausedRef.current = false;
          startTimeRef.current = timestamp;
          setProgress(0);
        }
      } else {
        const newProgress = Math.min(
          (elapsed / ANIMATION_DURATION_MS) * 100,
          100,
        );
        setProgress(newProgress);
        if (newProgress >= 100) {
          isPausedRef.current = true;
          startTimeRef.current = timestamp;
        }
      }
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return progress;
}

// =============================================================================
// Sub-components
// =============================================================================

function BackgroundGlow() {
  return <div className="opt-bg-glow pointer-events-none absolute inset-0" />;
}

function TopGlow() {
  return (
    <div className="opt-top-glow pointer-events-none absolute inset-x-4 top-0 h-px rounded-full" />
  );
}

function CompressionIcon({
  scale,
  isComplete,
  primaryClass,
}: {
  readonly scale: number;
  readonly isComplete: boolean;
  readonly primaryClass: string;
}) {
  return (
    <div className="relative size-3.5">
      {/* 圖片圖標 - 壓縮動畫 */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={cn(
          "opt-icon-glow size-full transition-opacity duration-300",
          primaryClass,
          isComplete && "opacity-0",
        )}
        style={{ transform: `scale(${scale})` }}
      >
        <rect
          x="2"
          y="2"
          width="20"
          height="20"
          rx="3"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <circle cx="8" cy="7" r="2" fill="currentColor" opacity="0.8" />
        <path
          d="M2 18l5-6 4 4 6-8 5 6v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-0z"
          fill="currentColor"
          opacity="0.5"
        />
      </svg>
      {/* 完成勾勾 */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={cn(
          "opt-icon-glow-strong absolute inset-0 size-full transition-all duration-300",
          primaryClass,
          isComplete ? "scale-100 opacity-100" : "scale-50 opacity-0",
        )}
      >
        <path
          d="M5 12l5 5L20 7"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function ProgressBar({
  progress,
  isComplete,
  bgClass,
  primaryClass,
}: {
  readonly progress: number;
  readonly isComplete: boolean;
  readonly bgClass: string;
  readonly primaryClass: string;
}) {
  const showParticle = progress > 5 && !isComplete;

  return (
    <div className="z-10 w-full px-1">
      <div className="relative h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={cn(
            "opt-progress-bar relative h-full rounded-full",
            bgClass,
          )}
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 rounded-full bg-linear-to-b from-white/40 to-transparent" />
          <div
            className={cn(
              "opt-particle absolute top-1/2 right-0 size-1 -translate-y-1/2 rounded-full bg-white transition-opacity duration-150",
              showParticle ? "opacity-100" : "opacity-0",
            )}
          />
        </div>
      </div>
      <div className="mt-1 flex justify-between font-mono text-[8px]">
        <span className="text-white/40">0%</span>
        <span
          className={cn(
            "font-bold transition-all duration-200",
            isComplete ? [primaryClass, "opt-text-glow"] : "text-white/60",
          )}
        >
          {Math.round(progress)}%
        </span>
        <span className="text-white/40">100%</span>
      </div>
    </div>
  );
}

function FileSizeDisplay({
  originalSize,
  optimizedSize,
  progress,
  isComplete,
  primaryClass,
}: {
  readonly originalSize: number;
  readonly optimizedSize: number;
  readonly progress: number;
  readonly isComplete: boolean;
  readonly primaryClass: string;
}) {
  const showStrike = progress > 15;
  const showArrow = progress > 30;
  const showOptimized = progress > 40;

  return (
    <div className="z-10 flex items-center gap-1">
      {/* 原始大小 + 刪除線 */}
      <span className="relative font-mono text-[8px] text-white/50">
        {originalSize}KB
        <span
          className={cn(
            "absolute top-1/2 left-0 h-px bg-white/60 transition-[width] duration-300",
            showStrike ? "w-full" : "w-0",
          )}
        />
      </span>
      {/* 箭頭 */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={cn(
          "size-2 transition-all duration-300",
          primaryClass,
          showArrow ? "translate-x-0 opacity-60" : "-translate-x-1 opacity-0",
        )}
      >
        <path
          d="M5 12h14M13 6l6 6-6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {/* 壓縮後大小 */}
      <span
        className={cn(
          "font-mono text-[10px] font-bold transition-all duration-300",
          primaryClass,
          isComplete && "opt-text-glow-strong",
          showOptimized ? "translate-x-0" : "-translate-x-1",
          showOptimized
            ? isComplete
              ? "opacity-100"
              : "opacity-80"
            : "opacity-0",
        )}
      >
        {optimizedSize}KB
      </span>
    </div>
  );
}

function CompletionGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 animate-pulse">
      <div className="opt-complete-border absolute inset-0 rounded-xl border" />
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function ImageOptimizationCard({
  format = "WebP",
  originalSize = 1024,
  className = "",
}: ImageOptimizationCardProps) {
  const progress = useLoopingProgress();
  const colors = FORMAT_COLORS[format];
  const compressionAmount = progress * COMPRESSION_RATIO;
  const optimizedSize = Math.round(
    (originalSize * (100 - compressionAmount)) / 100,
  );
  const isComplete = progress >= 100;

  return (
    <div
      className={cn(
        "opt-card group relative flex h-24 w-28 flex-col items-center justify-between overflow-hidden rounded-xl border border-white/10 bg-linear-to-b from-white/10 to-transparent p-3 backdrop-blur-md transition-shadow duration-500",
        className,
      )}
      style={{ "--color": colors.color } as CSSProperties}
      data-complete={isComplete}
    >
      <BackgroundGlow />
      <TopGlow />

      <div className="z-10 flex items-center gap-1">
        <CompressionIcon
          scale={1 - compressionAmount * 0.007}
          isComplete={isComplete}
          primaryClass={colors.primary}
        />
        <span
          className={cn(
            "text-[11px] font-bold tracking-wider transition-all duration-300",
            colors.primary,
            isComplete && "opt-text-glow-strong",
          )}
        >
          {format}
        </span>
      </div>

      <ProgressBar
        progress={progress}
        isComplete={isComplete}
        bgClass={colors.bg}
        primaryClass={colors.primary}
      />
      <FileSizeDisplay
        originalSize={originalSize}
        optimizedSize={optimizedSize}
        progress={progress}
        isComplete={isComplete}
        primaryClass={colors.primary}
      />

      {isComplete && <CompletionGlow />}
    </div>
  );
}
