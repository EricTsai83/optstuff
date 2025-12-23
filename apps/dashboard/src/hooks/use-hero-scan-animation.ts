import { useCallback, useEffect, useRef, useState } from "react";

/** Total scan animation duration (ms) */
const SCAN_DURATION_MS = 1600;

/** Progress percentage at which decode animation starts */
const DECODE_START_PROGRESS = 10;

/** Progress percentage at which optimization is triggered */
const OPTIMIZE_PROGRESS = 100;

/**
 * Progress percentage at which beam exits (moves off screen).
 * This allows the beam to continue moving down after optimization.
 */
const BEAM_EXIT_PROGRESS = 130;

type UseHeroScanAnimationResult = {
  readonly scanProgress: number;
  readonly isOptimized: boolean;
  readonly shouldStartDecode: boolean;
  /** Track if animation has started (to avoid hydration mismatch) */
  readonly hasStarted: boolean;
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
  const [animationRunId, setAnimationRunId] = useState(0);

  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);

  const restart = useCallback((): void => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    startTimeRef.current = null;
    setScanProgress(0);
    setIsOptimized(false);
    setShouldStartDecode(false);
    setHasStarted(false);
    setAnimationRunId((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!isEnabled) {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      startTimeRef.current = null;
      return;
    }

    const animate = (timestamp: number): void => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
        // Mark animation as started on first frame
        setHasStarted(true);
      }

      const elapsed = timestamp - startTimeRef.current;
      // Allow progress to go beyond 100 for beam exit animation
      const exitDuration =
        SCAN_DURATION_MS * (BEAM_EXIT_PROGRESS / OPTIMIZE_PROGRESS);
      const progress = Math.min(
        (elapsed / exitDuration) * BEAM_EXIT_PROGRESS,
        BEAM_EXIT_PROGRESS,
      );

      setScanProgress(progress);

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
    };
  }, [animationRunId, isEnabled]);

  return {
    scanProgress,
    isOptimized,
    shouldStartDecode,
    hasStarted,
    restart,
  };
}
