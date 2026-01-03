"use client";

import { useEffect, useState } from "react";

/** Image formats to cycle through before optimization */
const IMAGE_FORMATS = [
  ".jpeg",
  ".png",
  ".gif",
  ".bmp",
  ".tiff",
  ".raw",
] as const;

type ImageFormat = (typeof IMAGE_FORMATS)[number];

/** Interval in ms between format switches */
const FORMAT_CYCLE_INTERVAL_MS = 120;

/** Final optimized format */
const OPTIMIZED_FORMAT = ".webp" as const;

/**
 * Cycles through image formats until optimization completes.
 *
 * @param isOptimized - Whether optimization is complete
 * @returns Current format string (e.g., ".jpeg", ".webp")
 */
export function useFormatCycle(isOptimized: boolean): string {
  const [formatIndex, setFormatIndex] = useState(0);

  // Cycle through formats while not optimized
  useEffect(() => {
    if (isOptimized) return;

    const intervalId = setInterval(() => {
      setFormatIndex((prev) => (prev + 1) % IMAGE_FORMATS.length);
    }, FORMAT_CYCLE_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isOptimized]);

  // Reset index when restarting
  useEffect(() => {
    if (!isOptimized) {
      setFormatIndex(0);
    }
  }, [isOptimized]);

  if (isOptimized) {
    return OPTIMIZED_FORMAT;
  }

  return getFormatAtIndex(formatIndex);
}

function getFormatAtIndex(index: number): ImageFormat {
  const format = IMAGE_FORMATS[index];
  // Fallback to first format if index is out of bounds
  return format ?? IMAGE_FORMATS[0];
}
