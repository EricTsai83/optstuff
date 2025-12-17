"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TransitionEvent } from "react";

import {
  OPTIMIZED_SIZE_RATIO,
  ORIGINAL_SIZE_KB,
  SIZE_REDUCTION_RATE,
} from "@/components/hero-animation-parts/constants";
import { FileInfoPanel } from "@/components/hero-animation-parts/file-info-panel";
import { OptimizationStatusLabel } from "@/components/hero-animation-parts/optimization-status-label";
import { PixelDecodeGrid } from "@/components/hero-animation-parts/pixel-decode-grid";
import { ProgressRingButton } from "@/components/hero-animation-parts/progress-ring-button";
import { SkeletonOverlay } from "@/components/hero-animation-parts/skeleton-overlay";
import { useFormatCycle } from "@/hooks/use-format-cycle";
import { useHeroScanAnimation } from "@/hooks/use-hero-scan-animation";
import { cn } from "@/lib/utils";

/** Canvas initialization state */
type CanvasState = "loading" | "fading" | "ready";

/** Fallback timeout for canvas first draw detection (ms) */
const CANVAS_DRAW_FALLBACK_MS = 200;

/** Fade-in transition duration (ms) */
const FADE_IN_DURATION_MS = 500;

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
  const [canvasState, setCanvasState] = useState<CanvasState>("loading");

  const isCanvasReady = canvasState === "ready";

  const { scanProgress, isOptimized, shouldStartDecode, hasStarted, restart } =
    useHeroScanAnimation(isCanvasReady);

  const currentFormat = useFormatCycle(isOptimized);

  // Event handlers
  const handleCanvasFirstDraw = useCallback((): void => {
    setCanvasState((prev) => (prev === "loading" ? "fading" : prev));
  }, []);

  const handleCanvasFadeInEnd = useCallback(
    (event: TransitionEvent<HTMLDivElement>): void => {
      if (event.propertyName !== "opacity") return;
      setCanvasState("ready");
    },
    [],
  );

  const handleRestart = useCallback((): void => {
    restart();
  }, [restart]);

  // Fallback: reveal canvas after timeout if first draw detection fails
  useFallbackTimeout({
    shouldSkip: canvasState !== "loading",
    delayMs: CANVAS_DRAW_FALLBACK_MS,
    onTimeout: () => setCanvasState("fading"),
  });

  // Fallback: complete fade-in after timeout if transitionend doesn't fire
  useFallbackTimeout({
    shouldSkip: canvasState !== "fading",
    delayMs: FADE_IN_DURATION_MS + 50, // Extra buffer to ensure animation completes
    onTimeout: () => setCanvasState("ready"),
  });

  // Calculate derived values
  const currentSize = calculateCurrentSizeKb(scanProgress, isOptimized);
  const reductionPercent = calculateSizeReductionPercent(currentSize);

  return (
    <div className="relative h-[400px] w-[400px]">
      {/* Status label (top right) */}
      <div className="absolute top-7 right-7">
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
        <ImageArea
          canvasState={canvasState}
          onTransitionEnd={handleCanvasFadeInEnd}
          skeleton={<SkeletonOverlay isVisible={canvasState === "loading"} />}
          canvas={
            <PixelDecodeGrid
              scanProgress={scanProgress}
              isOptimized={isOptimized}
              hasStarted={hasStarted}
              onFirstDraw={handleCanvasFirstDraw}
            />
          }
        />

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
              "border-accent/30 ring-accent/20 bg-white/[0.024] ring-1 ring-inset",
              "[transition-delay:500ms] duration-200",
              "before:animate-hero-card-border-flash",
            ]
          : "border-accent/10 bg-white/[0.018] [transition-delay:0ms] duration-500",
      )}
    >
      {children}
    </div>
  );
}

type ImageAreaProps = {
  readonly canvasState: CanvasState;
  readonly onTransitionEnd: (event: TransitionEvent<HTMLDivElement>) => void;
  readonly skeleton: React.ReactNode;
  readonly canvas: React.ReactNode;
};

function ImageArea({
  canvasState,
  onTransitionEnd,
  skeleton,
  canvas,
}: ImageAreaProps) {
  const showCanvas = canvasState !== "loading";

  return (
    <div
      className={cn(
        "absolute top-2 right-2 left-2 overflow-hidden rounded transition-colors duration-300",
        "bg-accent/5",
      )}
      style={{ height: "calc(100% - 80px)" }}
    >
      {/* Skeleton overlay */}
      {skeleton}

      {/* Canvas wrapper with fade-in transition */}
      <div
        className={cn(
          "absolute inset-0 will-change-[opacity]",
          showCanvas ? "opacity-100" : "opacity-0",
        )}
        style={{
          transition: `opacity ${FADE_IN_DURATION_MS}ms ease-out`,
        }}
        onTransitionEnd={onTransitionEnd}
      >
        {canvas}
      </div>
    </div>
  );
}

// ============================================================================
// Custom Hooks
// ============================================================================

type FallbackTimeoutOptions = {
  readonly shouldSkip: boolean;
  readonly delayMs: number;
  readonly onTimeout: () => void;
};

/**
 * Executes a callback after a delay, unless the skip condition is met.
 * Used as a fallback for environment-specific edge cases where events don't fire.
 *
 * Note: Uses ref for onTimeout to avoid re-setting timer on callback changes.
 */
function useFallbackTimeout({
  shouldSkip,
  delayMs,
  onTimeout,
}: FallbackTimeoutOptions): void {
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    if (shouldSkip) return;

    const timer = setTimeout(() => {
      onTimeoutRef.current();
    }, delayMs);

    return () => clearTimeout(timer);
  }, [shouldSkip, delayMs]);
}
