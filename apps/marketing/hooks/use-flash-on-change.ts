import { useEffect, useMemo, useRef, useState } from "react";

type UseFlashOnChangeOptions<T> = {
  /** The value(s) to watch for changes */
  readonly values: T;
  /** Fade-out animation duration in milliseconds */
  readonly fadeDurationMs?: number;
  /** Delay before starting fade-out after changes stop (milliseconds) */
  readonly debounceMs?: number;
  /** Glow color in RGB format without alpha (e.g., "34, 197, 94") */
  readonly glowColor?: string;
};

type AnimationRefs = {
  animation: React.MutableRefObject<number | null>;
  fadeStartTime: React.MutableRefObject<number | null>;
  debounceTimer: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
};

/**
 * Clears all active animations and timers
 */
function clearAnimations(refs: AnimationRefs): void {
  if (refs.animation.current !== null) {
    cancelAnimationFrame(refs.animation.current);
    refs.animation.current = null;
  }
  if (refs.debounceTimer.current !== null) {
    clearTimeout(refs.debounceTimer.current);
    refs.debounceTimer.current = null;
  }
}

/**
 * Creates the fade-out animation function
 */
function createFadeAnimation(
  refs: AnimationRefs,
  fadeDurationMs: number,
  setIntensity: React.Dispatch<React.SetStateAction<number>>,
): (now: number) => void {
  return function animate(now: number): void {
    if (refs.fadeStartTime.current === null) return;

    const elapsed = now - refs.fadeStartTime.current;
    const progress = Math.min(elapsed / fadeDurationMs, 1);

    // Ease-out curve for smooth fade
    const intensity = Math.pow(1 - progress, 2);

    setIntensity(intensity);

    if (progress < 1 && intensity > 0.001) {
      refs.animation.current = requestAnimationFrame(animate);
    } else {
      setIntensity(0);
      refs.fadeStartTime.current = null;
      refs.animation.current = null;
    }
  };
}

/**
 * Triggers a flash animation when watched values change.
 * Stays at full brightness while values keep changing,
 * then smoothly fades out after changes stop.
 *
 * @returns CSS properties to apply flash effect
 */
export function useFlashOnChange<T>({
  values,
  fadeDurationMs = 400,
  debounceMs = 150,
  glowColor = "34, 197, 94",
}: UseFlashOnChangeOptions<T>): React.CSSProperties {
  const [flashIntensity, setFlashIntensity] = useState(0);

  const refs: AnimationRefs = {
    animation: useRef<number | null>(null),
    fadeStartTime: useRef<number | null>(null),
    debounceTimer: useRef<ReturnType<typeof setTimeout> | null>(null),
  };

  // Serialize values for deep comparison
  const serializedValues = useMemo(() => JSON.stringify(values), [values]);
  const prevSerializedRef = useRef(serializedValues);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearAnimations(refs);
  }, []);

  // Trigger flash on value change
  useEffect(() => {
    const hasChanged = prevSerializedRef.current !== serializedValues;

    // Skip if no change (including first render)
    if (!hasChanged) return;

    prevSerializedRef.current = serializedValues;
    clearAnimations(refs);

    // Immediately set to full brightness
    setFlashIntensity(1);
    refs.fadeStartTime.current = null;

    // Start fade-out after debounce period
    refs.debounceTimer.current = setTimeout(() => {
      refs.fadeStartTime.current = performance.now();

      const animate = createFadeAnimation(
        refs,
        fadeDurationMs,
        setFlashIntensity,
      );
      refs.animation.current = requestAnimationFrame(animate);
    }, debounceMs);
  }, [serializedValues, fadeDurationMs, debounceMs]);

  // Compute flash styles based on current intensity
  const flashStyle = useMemo<React.CSSProperties>(() => {
    if (flashIntensity === 0) {
      return {};
    }

    const innerGlow = `0 0 ${4 + 8 * flashIntensity}px rgba(${glowColor}, ${0.6 * flashIntensity})`;
    const outerGlow = `0 0 ${8 + 16 * flashIntensity}px rgba(${glowColor}, ${0.3 * flashIntensity})`;

    return {
      boxShadow: `${innerGlow}, ${outerGlow}`,
      outline: `1px solid rgba(${glowColor}, ${0.5 * flashIntensity})`,
      outlineOffset: "0px",
    };
  }, [flashIntensity, glowColor]);

  return flashStyle;
}
