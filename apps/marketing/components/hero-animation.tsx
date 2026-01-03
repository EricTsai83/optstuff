"use client";

import { useCallback } from "react";

import {
  OPTIMIZED_SIZE_RATIO,
  ORIGINAL_SIZE_KB,
  SIZE_REDUCTION_RATE,
} from "@/components/hero-animation-parts/constants";
import { FileInfoPanel } from "@/components/hero-animation-parts/file-info-panel";
import { OptimizationStatusLabel } from "@/components/hero-animation-parts/optimization-status-label";
import { PixelDecodeGrid } from "@/components/hero-animation-parts/pixel-decode-grid";
import { ProgressRingButton } from "@/components/hero-animation-parts/progress-ring-button";
import { useFormatCycle } from "@/hooks/use-format-cycle";
import { useHeroScanAnimation } from "@/hooks/use-hero-scan-animation";
import { cn } from "@workspace/ui/lib/utils";

/**
 * Calculates current file size based on scan progress and optimization state.
 */
function calculateCurrentSizeKb(
  scanProgress: number,
  isOptimized: boolean,
): number {
  if (isOptimized) {
    return Math.round(ORIGINAL_SIZE_KB * OPTIMIZED_SIZE_RATIO);
  }
  return Math.round(
    ORIGINAL_SIZE_KB * (1 - scanProgress * SIZE_REDUCTION_RATE),
  );
}

/**
 * Calculates the percentage of size reduction from the original.
 */
function calculateSizeReductionPercent(currentSize: number): number {
  return Math.round(
    ((ORIGINAL_SIZE_KB - currentSize) / ORIGINAL_SIZE_KB) * 100,
  );
}

/**
 * Hero section animation component.
 *
 * Displays an image optimization visualization with:
 * - Scanning beam effect
 * - Format conversion (.jpeg → .webp)
 * - File size reduction display
 */
export function HeroAnimation() {
  const { scanProgress, isOptimized, shouldStartDecode, hasStarted, restart } =
    useHeroScanAnimation(true);

  const currentFormat = useFormatCycle(isOptimized);

  const handleRestart = useCallback((): void => {
    restart();
  }, [restart]);

  // Calculate derived values
  const currentSize = calculateCurrentSizeKb(scanProgress, isOptimized);
  const reductionPercent = calculateSizeReductionPercent(currentSize);

  return (
    <div className="relative aspect-square w-full">
      {/* Status label (top right) */}
      <div className="absolute top-7 right-7 z-10">
        <OptimizationStatusLabel
          shouldStartDecode={shouldStartDecode}
          isOptimized={isOptimized}
        />
      </div>

      {/* Grid background pattern */}
      <GridBackgroundPattern />

      {/* Radial gradient ambient light */}
      <RadialGradientOverlay />

      {/* Main card container */}
      <MainCard isOptimized={isOptimized}>
        {/* Image area with pixel decode effect */}
        <ImageArea>
          <PixelDecodeGrid
            scanProgress={scanProgress}
            isOptimized={isOptimized}
            hasStarted={hasStarted}
          />
        </ImageArea>

        {/* Bottom info section */}
        <div className="absolute right-0 bottom-0 left-0 h-[72px] px-4 pb-2">
          <FileInfoPanel
            currentFormat={currentFormat}
            currentSize={currentSize}
            reductionPercent={reductionPercent}
            isOptimized={isOptimized}
          />
          <ProgressRingButton
            scanProgress={scanProgress}
            isOptimized={isOptimized}
            onRestart={handleRestart}
          />
        </div>
      </MainCard>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function GridBackgroundPattern() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.02]"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgb(16 185 129) 1px, transparent 1px),
          linear-gradient(to bottom, rgb(16 185 129) 1px, transparent 1px)
        `,
        backgroundSize: "33.33px 50px",
      }}
    />
  );
}

function RadialGradientOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          "radial-gradient(circle at 50% 30%, rgba(16, 185, 129, 0.04) 0%, transparent 70%)",
      }}
    />
  );
}

type MainCardProps = {
  readonly isOptimized: boolean;
  readonly children: React.ReactNode;
};

function MainCard({ isOptimized, children }: MainCardProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 rounded-lg border transition-[box-shadow,background-color,border-color] ease-out will-change-[box-shadow,border-color,background-color]",
        "before:ring-accent/40 before:pointer-events-none before:absolute before:inset-0 before:rounded-lg before:opacity-0 before:ring-2 before:content-[''] before:ring-inset",
        isOptimized
          ? [
              "border-accent/30 ring-accent/20 bg-popover/78 ring-1 ring-inset",
              "[transition-delay:500ms] duration-200",
              "before:animate-hero-card-border-flash",
            ]
          : "border-accent/10 bg-popover/78 [transition-delay:0ms] duration-500",
      )}
    >
      {children}
    </div>
  );
}

type ImageAreaProps = {
  readonly children: React.ReactNode;
};

function ImageArea({ children }: ImageAreaProps) {
  return (
    <div
      className={cn(
        "absolute top-2 right-2 left-2 overflow-hidden rounded transition-colors duration-300",
        "bg-accent/5",
      )}
      style={{ height: "calc(100% - 80px)" }}
    >
      {children}
    </div>
  );
}
