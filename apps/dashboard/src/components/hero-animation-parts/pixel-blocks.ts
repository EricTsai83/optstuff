import { GRID_COLS, GRID_ROWS } from "./constants";
import {
  isPatternFilled,
  JPEG_PATTERN,
  SCRAMBLE_PATTERN,
  WEBP_PATTERN,
} from "./pixel-patterns";

// ============================================================================
// Types
// ============================================================================

export type PixelBlock = {
  readonly id: string;
  readonly row: number;
  readonly col: number;
  /** Random offset for visual variety */
  readonly offsetX: number;
  readonly offsetY: number;
  /** JPEG artifact simulation - size variation */
  readonly jpegSizeMultiplier: number;
  /** Shared background opacity for non-letter cells */
  readonly backgroundOpacity: number;
  /** JPEG letter cells opacity (stronger than background) */
  readonly jpegPatternOpacity: number;
  /** WebP letter cells opacity (stronger than background) */
  readonly webpPatternOpacity: number;
  /** Decode animation delay based on position */
  readonly decodeDelay: number;
  /** Whether this block is part of the JPEG text pattern */
  readonly isJpegPattern: boolean;
  /** Whether this block is part of the WebP text pattern */
  readonly isWebpPattern: boolean;
  /** Whether this block is part of the scramble pattern */
  readonly isScramblePattern: boolean;
};

// ============================================================================
// Constants
// ============================================================================

/** Decimal precision for random values (avoids hydration mismatch) */
const RANDOM_PRECISION = 3;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Rounds a number to a fixed precision to avoid hydration mismatch
 * between server and client due to floating-point differences.
 */
function roundToPrecision(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Deterministic pseudo-random generator for stable visuals.
 */
function getPseudoRandom(seed: number, offset: number): number {
  const x = Math.sin(seed * 9999 + offset) * 10000;
  return x - Math.floor(x);
}

/**
 * Generates a rounded pseudo-random value.
 */
function getRoundedRandom(seed: number, offset: number): number {
  return roundToPrecision(getPseudoRandom(seed, offset), RANDOM_PRECISION);
}

// ============================================================================
// Block Generation
// ============================================================================

/**
 * Creates a single pixel block for the given grid position.
 */
function createPixelBlock(row: number, col: number): PixelBlock {
  const seed = row * GRID_COLS + col;

  // Pattern flags
  const isJpegPattern = isPatternFilled(
    JPEG_PATTERN,
    row,
    col,
    GRID_ROWS,
    GRID_COLS,
  );
  const isWebpPattern = isPatternFilled(
    WEBP_PATTERN,
    row,
    col,
    GRID_ROWS,
    GRID_COLS,
  );
  const isScramblePattern = isPatternFilled(
    SCRAMBLE_PATTERN,
    row,
    col,
    GRID_ROWS,
    GRID_COLS,
  );

  // Pre-compute random values
  const rand1 = getRoundedRandom(seed, 1);
  const rand2 = getRoundedRandom(seed, 2);
  const rand3 = getRoundedRandom(seed, 3);
  const rand4 = getRoundedRandom(seed, 4);
  const rand5 = getRoundedRandom(seed, 5);
  const rand6 = getRoundedRandom(seed, 6);

  return {
    id: `${row}-${col}`,
    row,
    col,
    // JPEG has more chaotic positioning
    offsetX: roundToPrecision((rand1 - 0.5) * 2, RANDOM_PRECISION),
    offsetY: roundToPrecision((rand2 - 0.5) * 2, RANDOM_PRECISION),
    // JPEG blocks vary in size (compression artifacts)
    jpegSizeMultiplier: roundToPrecision(0.7 + rand3 * 0.6, RANDOM_PRECISION),
    // Shared background opacity for base grid look
    backgroundOpacity: roundToPrecision(0.04 + rand4 * 0.07, RANDOM_PRECISION),
    jpegPatternOpacity: roundToPrecision(0.5 + rand4 * 0.3, RANDOM_PRECISION),
    // WebP letters more prominent after decode
    webpPatternOpacity: roundToPrecision(0.74 + rand5 * 0.2, RANDOM_PRECISION),
    // Decode delay based on row
    decodeDelay: roundToPrecision(rand6 * 80, RANDOM_PRECISION),
    isJpegPattern,
    isWebpPattern,
    isScramblePattern,
  };
}

/**
 * Generates all pixel blocks with stable random variations.
 */
function generatePixelBlocks(): readonly PixelBlock[] {
  const blocks: PixelBlock[] = [];

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      blocks.push(createPixelBlock(row, col));
    }
  }

  return blocks;
}

/** Pre-computed pixel blocks (calculated once at module load) */
export const PIXEL_BLOCKS = generatePixelBlocks();
