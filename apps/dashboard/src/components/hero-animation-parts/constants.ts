// ============================================================================
// File Size Constants
// ============================================================================

/** Original file size in KB */
export const ORIGINAL_SIZE_KB = 2400;

/** Optimized file size ratio (35% of original) */
export const OPTIMIZED_SIZE_RATIO = 0.35;

/** Size reduction rate per progress percentage */
export const SIZE_REDUCTION_RATE = 0.0065;

// ============================================================================
// Grid Configuration
// ============================================================================

/** Number of columns in the pixel grid */
export const GRID_COLS = 38;

/** Number of rows in the pixel grid */
export const GRID_ROWS = 17;

// ============================================================================
// Animation Timing
// ============================================================================

/**
 * Delay (ms) before applying "optimized" highlight accents.
 * Keep in sync with visual flash/highlight timing.
 */
export const OPTIMIZATION_HIGHLIGHT_DELAY_MS = 500;

/**
 * How many rows before the scan beam we begin decoding.
 *
 * Uses a continuous ramp so when the beam reaches a row
 * (distanceFromScan === 0), it is already fully decoded.
 */
export const DECODE_RAMP_ROWS = 2.8;

/**
 * Finish decode this many rows before scan exits the text band.
 * Larger value = finish earlier.
 */
export const DECODE_END_EARLY_ROWS = 1;

/** Distance (in rows) within which pixels show scrambled pattern */
export const SCRAMBLE_RANGE = 1;

/** Scan line glow half thickness (in px) - unused, kept for reference */
export const SCAN_GLOW_HALF_THICKNESS_PX = 12;

// ============================================================================
// Accent Color
// ============================================================================

/** Accent color RGB components */
const ACCENT_R = 16;
const ACCENT_G = 185;
const ACCENT_B = 129;

/**
 * Formats an RGBA string for the shared accent color.
 */
export function accentRgba(alpha: number): string {
  return `rgba(${ACCENT_R}, ${ACCENT_G}, ${ACCENT_B}, ${alpha})`;
}
