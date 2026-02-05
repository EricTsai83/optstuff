"use client";

import { useEffect, useState } from "react";

type ScrollConfig = {
  readonly threshold: number;
  readonly divisor: number;
};

/**
 * Calculate scroll percentage
 */
function calculateScrollPercent(
  scrollY: number,
  threshold: number,
  divisor: number,
) {
  return Math.min(scrollY / divisor / threshold, 1);
}

/**
 * Hook to track page scroll percentage
 *
 * @param config - Scroll configuration
 * @returns Scroll percentage (0 to 1)
 */
export function useScrollPercent({ threshold, divisor }: ScrollConfig) {
  const [scrollPercent, setScrollPercent] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const percent = calculateScrollPercent(
        window.scrollY,
        threshold,
        divisor,
      );
      setScrollPercent(percent);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [threshold, divisor]);

  return scrollPercent;
}

/**
 * Calculate background opacity
 */
export function calculateBackgroundOpacity(
  scrollPercent: number,
  maxOpacity: number,
) {
  return scrollPercent * maxOpacity;
}

/**
 * Calculate border opacity
 */
export function calculateBorderOpacity(
  scrollPercent: number,
  divisor: number,
  maxOpacity: number,
) {
  return Math.min(scrollPercent / divisor, maxOpacity);
}
