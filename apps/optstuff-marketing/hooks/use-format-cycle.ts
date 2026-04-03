import { BEAM_EXIT_PROGRESS } from "@/hooks/use-hero-scan-animation";

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

/** Number of full loops shown before optimization completes */
const FORMAT_CYCLE_COUNT = 4;

/** Final optimized format */
const OPTIMIZED_FORMAT = ".webp" as const;

/**
 * Cycles through image formats until optimization completes.
 *
 * @param scanProgress - Current scan progress for the active run
 * @param isOptimized - Whether optimization is complete
 * @returns Current format string (e.g., ".jpeg", ".webp")
 */
export function useFormatCycle(scanProgress: number, isOptimized: boolean) {
  if (isOptimized) {
    return OPTIMIZED_FORMAT;
  }

  const progress01 = Math.max(
    0,
    Math.min(scanProgress / BEAM_EXIT_PROGRESS, 0.999),
  );
  const totalSteps = IMAGE_FORMATS.length * FORMAT_CYCLE_COUNT;
  const formatIndex =
    Math.floor(progress01 * totalSteps) % IMAGE_FORMATS.length;

  return getFormatAtIndex(formatIndex);
}

function getFormatAtIndex(index: number): ImageFormat {
  const format = IMAGE_FORMATS[index];
  // Fallback to first format if index is out of bounds
  return format ?? IMAGE_FORMATS[0];
}
