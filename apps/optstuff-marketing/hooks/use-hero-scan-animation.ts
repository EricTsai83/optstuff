import { useCallback, useEffect, useRef, useState } from "react";

/** Total scan animation duration (ms) */
export const SCAN_DURATION_MS = 1600;

/** Progress percentage at which decode animation starts */
export const DECODE_START_PROGRESS = 10;

/** Progress percentage at which optimization is triggered */
export const OPTIMIZE_PROGRESS = 100;

/**
 * Progress percentage at which beam exits (moves off screen).
 * This allows the beam to continue moving down after optimization.
 */
export const BEAM_EXIT_PROGRESS = 130;

/** UI updates can be slower than the canvas animation. */
const DISPLAY_UPDATE_INTERVAL_MS = 1000 / 30;

export function getHeroExitDurationMs() {
  return SCAN_DURATION_MS * (BEAM_EXIT_PROGRESS / OPTIMIZE_PROGRESS);
}

export function getHeroProgressFromElapsedMs(elapsedMs: number) {
  return Math.min(
    (elapsedMs / getHeroExitDurationMs()) * BEAM_EXIT_PROGRESS,
    BEAM_EXIT_PROGRESS,
  );
}

type UseHeroScanAnimationResult = {
  readonly scanProgress: number;
  readonly isOptimized: boolean;
  readonly shouldStartDecode: boolean;
  /** Track if animation has started (to avoid hydration mismatch) */
  readonly hasStarted: boolean;
  /** Timestamp when the current animation run started */
  readonly cycleStartTimeMs: number | null;
  /** Unique id to reset consumers with their own animation loops */
  readonly animationRunId: number;
  /** Restarts the scan + decode animation from the beginning */
  readonly restart: () => void;
};

/**
 * Encapsulates the scan animation state machine used by HeroAnimation.
 *
 * Manages the requestAnimationFrame loop and exposes a declarative API
 * for the UI component.
 */
export function useHeroScanAnimation(
  isEnabled: boolean = true,
): UseHeroScanAnimationResult {
  const [scanProgress, setScanProgress] = useState(0);
  const [isOptimized, setIsOptimized] = useState(false);
  const [shouldStartDecode, setShouldStartDecode] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [cycleStartTimeMs, setCycleStartTimeMs] = useState<number | null>(null);
  const [animationRunId, setAnimationRunId] = useState(0);

  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastDisplayUpdateTimeRef = useRef<number | null>(null);

  const restart = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    startTimeRef.current = null;
    setScanProgress(0);
    setIsOptimized(false);
    setShouldStartDecode(false);
    setHasStarted(false);
    setCycleStartTimeMs(null);
    setAnimationRunId((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!isEnabled) {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      startTimeRef.current = null;
      lastDisplayUpdateTimeRef.current = null;
      return;
    }

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
        lastDisplayUpdateTimeRef.current = timestamp;
        // Mark animation as started on first frame
        setHasStarted(true);
        setCycleStartTimeMs(timestamp);
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = getHeroProgressFromElapsedMs(elapsed);

      const lastDisplayUpdate = lastDisplayUpdateTimeRef.current ?? 0;
      const shouldUpdateDisplay =
        timestamp - lastDisplayUpdate >= DISPLAY_UPDATE_INTERVAL_MS ||
        progress >= BEAM_EXIT_PROGRESS;

      if (shouldUpdateDisplay) {
        lastDisplayUpdateTimeRef.current = timestamp;
        setScanProgress(progress);
      }

      // Trigger decode animation when progress reaches threshold
      setShouldStartDecode((prev) => prev || progress >= DECODE_START_PROGRESS);

      // Mark as optimized when scan reaches 100%
      setIsOptimized((prev) => prev || progress >= OPTIMIZE_PROGRESS);

      // Continue animation until beam fully exits
      if (progress < BEAM_EXIT_PROGRESS) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      lastDisplayUpdateTimeRef.current = null;
    };
  }, [animationRunId, isEnabled]);

  return {
    scanProgress,
    isOptimized,
    shouldStartDecode,
    hasStarted,
    cycleStartTimeMs,
    animationRunId,
    restart,
  };
}
