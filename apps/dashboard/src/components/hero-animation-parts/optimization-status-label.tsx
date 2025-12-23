"use client";

import { useEffect, useState } from "react";

import { TextDecode } from "@/components/text-decode";
import { cn } from "@/lib/utils";

// ============================================================================
// Constants
// ============================================================================

/** Interval between each character starting decode (ms) */
const STAGGER_DELAY_MS = 60;

/** Duration each character stays in scrambling state (ms) */
const SCRAMBLE_DURATION_MS = 50;

/** Duration before fading out the optimized label (ms) */
const FADE_OUT_DELAY_MS = 2000;

/** Duration of fade in animation (ms) */
const FADE_IN_DURATION_MS = 500;

// ============================================================================
// Types
// ============================================================================

type OptimizationStatusLabelProps = {
  readonly shouldStartDecode: boolean;
  readonly isOptimized: boolean;
};

// ============================================================================
// Component
// ============================================================================

/**
 * Optimization status label showing processing state with decode effect.
 *
 * - Waiting: shows "waiting..."
 * - Optimizing: loops "optimizing..." decode animation
 * - Complete: shows "Success ✓" with glow effect, then fades out
 */
export function OptimizationStatusLabel({
  shouldStartDecode,
  isOptimized,
}: OptimizationStatusLabelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldBlink, setShouldBlink] = useState(false);

  useEffect(() => {
    if (!isOptimized) {
      setIsVisible(false);
      setShouldBlink(false);
      return;
    }

    // Fade in immediately
    setIsVisible(true);

    // Blink after fade in completes
    const blinkTimer = setTimeout(() => {
      setShouldBlink(true);
    }, FADE_IN_DURATION_MS);

    // Fade out after delay
    const fadeOutTimer = setTimeout(() => {
      setIsVisible(false);
    }, FADE_OUT_DELAY_MS);

    return () => {
      clearTimeout(blinkTimer);
      clearTimeout(fadeOutTimer);
    };
  }, [isOptimized]);

  const handleBlinkAnimationEnd = (): void => {
    setShouldBlink(false);
  };

  return (
    <div className="flex items-center gap-1.5 font-mono text-sm">
      <span
        className={cn(
          "relative transition-all duration-300",
          isOptimized ? "text-accent" : "text-accent/60",
        )}
      >
        <WaitingState isVisible={!shouldStartDecode} />
        <OptimizingState
          isVisible={shouldStartDecode && !isOptimized}
          shouldStop={isOptimized}
        />
        <CompletedState
          isVisible={isOptimized}
          isOpaque={isVisible}
          shouldBlink={shouldBlink}
          onAnimationEnd={handleBlinkAnimationEnd}
        />
      </span>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

type VisibilityProps = {
  readonly isVisible: boolean;
};

function WaitingState({ isVisible }: VisibilityProps) {
  if (!isVisible) return null;
  return <span className="text-accent/40">waiting...</span>;
}

type OptimizingStateProps = {
  readonly isVisible: boolean;
  readonly shouldStop: boolean;
};

function OptimizingState({ isVisible, shouldStop }: OptimizingStateProps) {
  if (!isVisible) return null;

  return (
    <TextDecode
      from="optimizing..."
      to="optimizing..."
      staggerDelay={STAGGER_DELAY_MS}
      scrambleDuration={SCRAMBLE_DURATION_MS}
      delay={0}
      shouldStop={shouldStop}
      showScanLine={true}
      showCursor={false}
      className="text-accent/70"
    />
  );
}

type CompletedStateProps = {
  readonly isVisible: boolean;
  readonly isOpaque: boolean;
  readonly shouldBlink: boolean;
  readonly onAnimationEnd: () => void;
};

function CompletedState({
  isVisible,
  isOpaque,
  shouldBlink,
  onAnimationEnd,
}: CompletedStateProps) {
  if (!isVisible) return null;

  return (
    <span
      className={cn(
        "text-accent font-semibold drop-shadow-[0_0_8px_oklch(0.7_0.18_160/0.4)] transition-opacity duration-700",
        isOpaque ? "opacity-100" : "opacity-0",
        shouldBlink && "animate-text-sweep-glow",
      )}
      onAnimationEnd={onAnimationEnd}
    >
      Success ✓
    </span>
  );
}
