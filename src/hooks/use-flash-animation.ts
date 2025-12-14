import { useEffect, useRef } from "react";

// ============================================================================
// Configuration
// ============================================================================

/** Flash animation timing configuration */
const FLASH_CONFIG = {
  /** Main flash duration (ms) */
  DURATION_MS: 3000,
  /** Peak intensity position (0-1) */
  PEAK_PERCENT: 0.08,
  /** Intensity threshold to stop animation */
  END_EPSILON: 0.002,
  /** Decay rate for main flash */
  DECAY_RATE: 4,
  /** Easing exponent for fade */
  FADE_EASING_EXPONENT: 0.75,
  /** Tail animation duration (ms) */
  TAIL_DURATION_MS: 2000,
  /** Decay rate for tail */
  TAIL_DECAY_RATE: 3,
} as const;

/**
 * Clamps a value between 0 and 1.
 */
function clamp01(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

/**
 * Calculates the base flash intensity during the main flash segment.
 */
function getMainFlashIntensity(mainProgress01: number): number {
  const progress01 = clamp01(mainProgress01);

  if (progress01 <= FLASH_CONFIG.PEAK_PERCENT) {
    // Quick ramp up to peak
    const rampProgress = progress01 / FLASH_CONFIG.PEAK_PERCENT;
    return 1 - Math.pow(1 - rampProgress, 2);
  }

  // Smooth fade out
  const fadeProgress =
    (progress01 - FLASH_CONFIG.PEAK_PERCENT) / (1 - FLASH_CONFIG.PEAK_PERCENT);

  const easedFadeProgress = Math.pow(
    Math.max(0, fadeProgress),
    FLASH_CONFIG.FADE_EASING_EXPONENT,
  );
  return Math.exp(-FLASH_CONFIG.DECAY_RATE * easedFadeProgress);
}

/**
 * Calculates the flash intensity for a given elapsed time (ms).
 */
function getFlashIntensityForElapsedMs(elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;

  const mainProgress = elapsedMs / FLASH_CONFIG.DURATION_MS;
  const mainIntensity = getMainFlashIntensity(Math.min(mainProgress, 1));

  if (mainProgress <= 1) return mainIntensity;

  const tailProgress =
    (elapsedMs - FLASH_CONFIG.DURATION_MS) / FLASH_CONFIG.TAIL_DURATION_MS;
  return mainIntensity * Math.exp(-FLASH_CONFIG.TAIL_DECAY_RATE * tailProgress);
}

// ============================================================================
// Types
// ============================================================================

type UseFlashAnimationOptions = {
  readonly isTriggered: boolean;
  readonly delayMs: number;
  readonly onFrame: (intensity: number) => void;
};

// ============================================================================
// Hook
// ============================================================================

/**
 * Manages a flash animation triggered by a state change.
 *
 * The animation starts after a configurable delay and calls onFrame
 * with the current intensity (0-1) on each animation frame.
 *
 * Note: Uses refs for onFrame to avoid re-subscribing on callback changes.
 */
export function useFlashAnimation({
  isTriggered,
  delayMs,
  onFrame,
}: UseFlashAnimationOptions): void {
  const prevTriggeredRef = useRef(isTriggered);
  const flashStartTimeRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable ref for onFrame to avoid effect re-runs
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  useEffect(() => {
    // Detect transition to triggered state
    if (isTriggered && !prevTriggeredRef.current) {
      delayTimerRef.current = setTimeout(() => {
        flashStartTimeRef.current = performance.now();

        const animateFlash = (now: number): void => {
          const elapsed = now - (flashStartTimeRef.current ?? now);
          const linearProgress = elapsed / FLASH_CONFIG.DURATION_MS;
          const intensity = getFlashIntensityForElapsedMs(elapsed);

          onFrameRef.current(intensity);

          const shouldContinue =
            linearProgress < 1 ||
            (elapsed <
              FLASH_CONFIG.DURATION_MS + FLASH_CONFIG.TAIL_DURATION_MS &&
              intensity > FLASH_CONFIG.END_EPSILON);

          if (shouldContinue) {
            rafIdRef.current = requestAnimationFrame(animateFlash);
          } else {
            onFrameRef.current(0);
            flashStartTimeRef.current = null;
          }
        };

        rafIdRef.current = requestAnimationFrame(animateFlash);
      }, delayMs);
    }
    prevTriggeredRef.current = isTriggered;

    return () => {
      if (delayTimerRef.current !== null) {
        clearTimeout(delayTimerRef.current);
      }
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [isTriggered, delayMs]);
}
