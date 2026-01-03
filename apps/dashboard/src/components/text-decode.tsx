"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Character set for generating scrambled text effect - tech-style characters
 */
const DECODE_CHARS =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZαβγδεζηθλμπστφψ@#$%&*<>[]{}";

type CharState = "waiting" | "decoding" | "decoded";

type CharData = {
  readonly char: string;
  readonly targetChar: string;
  readonly state: CharState;
};

type TextDecodeProps = {
  /** Starting text */
  readonly from: string;

  /** Target text */
  readonly to: string;

  /**
   * Time interval between each character starting its decode animation (in ms).
   *
   * Example: If staggerDelay = 100ms and you have 5 characters:
   * - Char 0 starts at 0ms
   * - Char 1 starts at 100ms
   * - Char 2 starts at 200ms
   * - ...
   *
   * @default 50
   */
  readonly staggerDelay?: number;

  /**
   * How long each character stays in the "scrambling" state,
   * rapidly cycling through random characters before revealing the target.
   *
   * Timeline for a single character:
   * [waiting] → [scrambling for scrambleDuration] → [decoded]
   *
   * @default 80
   */
  readonly scrambleDuration?: number;

  /**
   * Initial delay before the animation starts (in ms).
   *
   * @default 0
   */
  readonly delay?: number;

  /** Whether to show scan line effect during scrambling */
  readonly showScanLine?: boolean;

  /** Whether to show cursor effect */
  readonly showCursor?: boolean;

  /** Callback when all characters finish decoding */
  readonly onComplete?: () => void;

  /** Custom className */
  readonly className?: string;

  /** Whether to auto-start animation on mount */
  readonly autoStart?: boolean;

  /**
   * When true, stops the animation loop.
   * Animation loops indefinitely until this becomes true.
   */
  readonly shouldStop?: boolean;
};

/**
 * Generate a random scrambled character
 */
function getRandomChar(): string {
  return DECODE_CHARS[Math.floor(Math.random() * DECODE_CHARS.length)] ?? "0";
}

/**
 * Calculate the maximum length between two strings for alignment
 */
function getMaxLength(from: string, to: string): number {
  return Math.max(from.length, to.length);
}

/**
 * Tech-style text decode animation component.
 *
 * Transforms text from one string to another with a character-by-character
 * scanning effect. Each character goes through three states:
 *
 * 1. `waiting`  - Displays the original character
 * 2. `decoding` - Rapidly cycles through random characters (scrambling)
 * 3. `decoded`  - Displays the target character
 *
 * Animation timeline example (3 characters, staggerDelay=100ms, scrambleDuration=80ms):
 *
 * ```
 * Time (ms) →  0    50   100   150   180   200   250   280
 *
 * Char 0:     [=======scramble=======]
 *                                     [decoded]
 *
 * Char 1:          [wait] [=======scramble=======]
 *                                                 [decoded]
 *
 * Char 2:                 [  wait  ] [=======scramble=======]
 *                                                            [decoded]
 * ```
 *
 * Total duration = (charCount - 1) × staggerDelay + scrambleDuration
 */
export function TextDecode({
  from,
  to,
  staggerDelay = 50,
  scrambleDuration = 80,
  delay = 0,
  showScanLine = true,
  showCursor = true,
  onComplete,
  className,
  autoStart = true,
  shouldStop = false,
}: TextDecodeProps) {
  const maxLength = useMemo(() => getMaxLength(from, to), [from, to]);
  /** Increments each time animation starts, used to trigger useEffect */
  const [animationKey, setAnimationKey] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [chars, setChars] = useState<readonly CharData[]>([]);
  const [isAnimationDone, setIsAnimationDone] = useState(false);
  const intervalRefs = useRef<Map<number, ReturnType<typeof setInterval>>>(
    new Map(),
  );

  /**
   * Initialize character states - all start in "waiting" state
   */
  const initializeChars = useCallback((): readonly CharData[] => {
    const result: CharData[] = [];

    for (let i = 0; i < maxLength; i++) {
      const fromChar = from[i] ?? "";
      const toChar = to[i] ?? "";

      result.push({
        char: fromChar,
        targetChar: toChar,
        state: "waiting",
      });
    }

    return result;
  }, [from, to, maxLength]);

  /**
   * Reset animation to initial state
   */
  const reset = useCallback((): void => {
    // Clear all scramble intervals
    intervalRefs.current.forEach((interval) => clearInterval(interval));
    intervalRefs.current.clear();

    setCurrentIndex(-1);
    setChars(initializeChars());
    setIsAnimationDone(false);
  }, [initializeChars]);

  /**
   * Start the decode animation
   */
  const start = useCallback((): void => {
    reset();
    setAnimationKey((prev) => prev + 1);
  }, [reset]);

  // Initialize chars on mount
  useEffect(() => {
    setChars(initializeChars());
  }, [initializeChars]);

  // Auto-start animation with delay
  useEffect(() => {
    if (!autoStart) return;

    const timer = setTimeout(() => {
      start();
    }, delay);

    return () => clearTimeout(timer);
  }, [autoStart, delay, start]);

  // Main animation logic
  useEffect(() => {
    if (animationKey === 0 || chars.length === 0) return;

    const totalChars = maxLength;
    const timers: ReturnType<typeof setTimeout>[] = [];

    for (let i = 0; i < totalChars; i++) {
      // Each character starts at: i × staggerDelay
      const startTime = i * staggerDelay;

      const timer = setTimeout(() => {
        setCurrentIndex(i);

        // Transition to "decoding" state - start scrambling
        setChars((prev) =>
          prev.map((char, idx) =>
            idx === i ? { ...char, state: "decoding" as CharState } : char,
          ),
        );

        // Scramble loop: rapidly change character every 30ms
        const scrambleInterval = setInterval(() => {
          setChars((prev) =>
            prev.map((char, idx) =>
              idx === i && char.state === "decoding"
                ? { ...char, char: getRandomChar() }
                : char,
            ),
          );
        }, 30);

        intervalRefs.current.set(i, scrambleInterval);

        // After scrambleDuration, transition to "decoded" state
        const decodeCompleteTimer = setTimeout(() => {
          clearInterval(scrambleInterval);
          intervalRefs.current.delete(i);

          setChars((prev) =>
            prev.map((char, idx) =>
              idx === i
                ? {
                    ...char,
                    char: char.targetChar,
                    state: "decoded" as CharState,
                  }
                : char,
            ),
          );

          // Check if this is the last character
          if (i === totalChars - 1) {
            setIsAnimationDone(true);
            onComplete?.();
          }
        }, scrambleDuration);

        timers.push(
          decodeCompleteTimer as unknown as ReturnType<typeof setTimeout>,
        );
      }, startTime);

      timers.push(timer);
    }

    return () => {
      timers.forEach(clearTimeout);
      intervalRefs.current.forEach((interval) => clearInterval(interval));
      intervalRefs.current.clear();
    };
  }, [
    animationKey,
    maxLength,
    staggerDelay,
    scrambleDuration,
    onComplete,
    chars.length,
  ]);

  // Auto-restart loop when animation completes and shouldStop is false
  useEffect(() => {
    if (!isAnimationDone || shouldStop) return;

    // Immediately restart animation
    start();
  }, [isAnimationDone, shouldStop, start]);

  return (
    <span
      className={cn("relative inline-flex font-mono tracking-wider", className)}
      aria-label={`Decoding from "${from}" to "${to}"`}
    >
      {chars.map((charData, index) => (
        <span
          key={index}
          className={cn(
            "relative inline-block transition-all duration-150",
            // Waiting state - dimmed
            charData.state === "waiting" && "text-muted-foreground/60",
            // Decoding state - accent color with pulse
            charData.state === "decoding" && ["text-accent", "animate-pulse"],
            // Decoded state - accent color with glow
            charData.state === "decoded" && [
              "text-accent",
              "drop-shadow-[0_0_8px_oklch(0.7_0.18_160/0.6)]",
            ],
          )}
        >
          {/* Scan line effect - visible only during scrambling */}
          {showScanLine && charData.state === "decoding" && (
            <span
              className="pointer-events-none absolute inset-0 overflow-hidden"
              aria-hidden="true"
            >
              <span className="animate-scan-line bg-accent/30 absolute h-full w-[2px]" />
            </span>
          )}

          {/* Character display */}
          <span className="relative z-10">{charData.char || "\u00A0"}</span>

          {/* Bottom glow line - visible after decoded */}
          {charData.state === "decoded" && (
            <span
              className="bg-accent/20 pointer-events-none absolute bottom-0 left-0 h-[2px] w-full"
              aria-hidden="true"
            />
          )}
        </span>
      ))}

      {/* Blinking cursor effect */}
      {showCursor && !isAnimationDone && animationKey > 0 && (
        <span
          className={cn(
            "bg-accent ml-0.5 inline-block h-[1.1em] w-[2px] animate-pulse",
            currentIndex >= maxLength - 1 && "opacity-0",
          )}
          aria-hidden="true"
        />
      )}
    </span>
  );
}

/**
 * Simplified version for one-way decode animation.
 *
 * Automatically generates scrambled starting text based on target text length.
 */
export function TextDecodeSimple({
  text,
  ...props
}: Omit<TextDecodeProps, "from" | "to"> & { readonly text: string }) {
  // Generate scrambled text with same length as target
  const from = useMemo(() => {
    return Array.from({ length: text.length }, () => getRandomChar()).join("");
  }, [text]);

  return <TextDecode from={from} to={text} {...props} />;
}
