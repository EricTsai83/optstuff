import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

import { useFlashAnimation } from "@/hooks/use-flash-animation";

import {
  clamp01,
  drawGlowRect,
  drawScanBeam,
  drawWebpGlow,
  getCanvasLayout,
  syncCanvasToContainer,
} from "./canvas-utils";
import type { CanvasLayout, TextRowBounds } from "./canvas-utils";
import {
  accentRgba,
  DECODE_END_EARLY_ROWS,
  DECODE_RAMP_ROWS,
  GRID_COLS,
  GRID_ROWS,
  OPTIMIZATION_HIGHLIGHT_DELAY_MS,
  SCRAMBLE_RANGE,
} from "./constants";
import type { PixelBlock } from "./pixel-blocks";
import { PIXEL_BLOCKS } from "./pixel-blocks";

// ============================================================================
// Types
// ============================================================================

type PixelDecodeGridProps = {
  readonly scanProgress: number;
  readonly isOptimized: boolean;
  readonly hasStarted: boolean;
  readonly onFirstDraw: (() => void) | undefined;
};

type DrawState = {
  readonly scanProgress: number;
  readonly isOptimized: boolean;
  readonly hasStarted: boolean;
  readonly flashIntensity: number;
};

// ============================================================================
// Constants
// ============================================================================

/** Pre-computed text row bounds for optimization */
const TEXT_ROW_BOUNDS = getTextRowBounds();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculates the bounds of rows containing text patterns.
 */
function getTextRowBounds(): TextRowBounds {
  let minRow = GRID_ROWS - 1;
  let maxRow = 0;

  for (const block of PIXEL_BLOCKS) {
    if (!block.isJpegPattern && !block.isWebpPattern) continue;
    if (block.row < minRow) minRow = block.row;
    if (block.row > maxRow) maxRow = block.row;
  }

  return { minRow, maxRow };
}

/**
 * Calculates decode progress for a block (0..1).
 *
 * Progress ramps up as the scan beam approaches, so blocks are
 * fully decoded (1.0) when the beam reaches them.
 */
function getDecodeProgress(
  isInTextBand: boolean,
  isOptimized: boolean,
  hasReachedTextBandEnd: boolean,
  distanceFromScan: number,
): number {
  if (!isInTextBand) {
    return isOptimized ? 1 : 0;
  }

  if (isOptimized || hasReachedTextBandEnd) return 1;

  const ramp = Math.max(DECODE_RAMP_ROWS, 0.001);
  const progress = (distanceFromScan + ramp) / ramp;
  return clamp01(progress);
}

// ============================================================================
// Block Drawing
// ============================================================================

type DrawBlockOptions = {
  readonly ctx: CanvasRenderingContext2D;
  readonly block: PixelBlock;
  readonly layout: CanvasLayout;
  readonly state: DrawState;
  readonly textBounds: TextRowBounds;
  readonly currentScanRow: number;
};

/**
 * Draws a single pixel block with its visual states.
 */
function drawBlock(options: DrawBlockOptions): void {
  const { ctx, block, layout, state, textBounds, currentScanRow } = options;

  const x = layout.padding + block.col * (layout.cellWidth + layout.gap);
  const y = layout.padding + block.row * (layout.cellHeight + layout.gap);

  // Draw stable background cell
  ctx.fillStyle = accentRgba(block.backgroundOpacity);
  ctx.fillRect(x, y, layout.cellWidth, layout.cellHeight);

  // Calculate visual state
  const distanceFromScan = currentScanRow - block.row;
  const isInTextBand =
    block.row >= textBounds.minRow && block.row <= textBounds.maxRow;
  const hasReachedTextBandEnd =
    currentScanRow >= textBounds.maxRow - DECODE_END_EARLY_ROWS;

  const decodeProgress = getDecodeProgress(
    isInTextBand,
    state.isOptimized,
    hasReachedTextBandEnd,
    distanceFromScan,
  );
  const decoded = decodeProgress >= 1;
  const scrambling =
    state.hasStarted &&
    !state.isOptimized &&
    !decoded &&
    isInTextBand &&
    Math.abs(distanceFromScan) < SCRAMBLE_RANGE;

  const opacity = decodeProgress;
  const scale = decodeProgress;

  // Draw JPEG letter cells (fade out during decode)
  if (block.isJpegPattern) {
    drawJpegCell(ctx, block, x, y, layout, {
      isOptimized: state.isOptimized,
      decoded,
      scrambling,
      isInTextBand,
      opacity,
    });
  }

  // Draw scramble block
  if (scrambling && block.isScramblePattern) {
    ctx.fillStyle = accentRgba(0.5);
    ctx.fillRect(x, y, layout.cellWidth, layout.cellHeight);
  }

  // Draw WebP letter cells (scale in)
  if (block.isWebpPattern && scale > 0.01) {
    drawWebpCell(ctx, block, x, y, layout, {
      opacity,
      scale,
      flashIntensity: state.flashIntensity,
    });
  }
}

type JpegCellState = {
  readonly isOptimized: boolean;
  readonly decoded: boolean;
  readonly scrambling: boolean;
  readonly isInTextBand: boolean;
  readonly opacity: number;
};

function drawJpegCell(
  ctx: CanvasRenderingContext2D,
  block: PixelBlock,
  x: number,
  y: number,
  layout: CanvasLayout,
  state: JpegCellState,
): void {
  const jpegFade =
    state.isOptimized || state.decoded
      ? 0
      : state.scrambling
        ? 0
        : state.isInTextBand
          ? 1 - state.opacity
          : 1;

  const jpegOpacity = block.jpegPatternOpacity * clamp01(jpegFade);
  if (jpegOpacity <= 0.01) return;

  ctx.fillStyle = accentRgba(jpegOpacity);
  ctx.fillRect(x, y, layout.cellWidth, layout.cellHeight);

  if (jpegOpacity > 0.3) {
    drawGlowRect({
      ctx,
      x,
      y,
      width: layout.cellWidth,
      height: layout.cellHeight,
      color: accentRgba(0.4),
      blur: 4,
    });
    ctx.shadowBlur = 0;
  }
}

type WebpCellState = {
  readonly opacity: number;
  readonly scale: number;
  readonly flashIntensity: number;
};

function drawWebpCell(
  ctx: CanvasRenderingContext2D,
  block: PixelBlock,
  x: number,
  y: number,
  layout: CanvasLayout,
  state: WebpCellState,
): void {
  const webpOpacity = clamp01(block.webpPatternOpacity * state.opacity);
  const scaledWidth = layout.cellWidth * state.scale;
  const scaledHeight = layout.cellHeight * state.scale;
  const offsetX = (layout.cellWidth - scaledWidth) / 2;
  const offsetY = (layout.cellHeight - scaledHeight) / 2;

  ctx.fillStyle = accentRgba(webpOpacity);
  ctx.fillRect(x + offsetX, y + offsetY, scaledWidth, scaledHeight);

  if (webpOpacity > 0.3) {
    drawWebpGlow({
      ctx,
      x: x + offsetX,
      y: y + offsetY,
      width: scaledWidth,
      height: scaledHeight,
      flashIntensity: state.flashIntensity,
    });
  }
}

// ============================================================================
// Component
// ============================================================================

/**
 * Pixel decode grid component (Canvas-based for performance).
 *
 * Displays a grid of blocks that spell "JPEG" initially,
 * then transform to spell "WebP" as the scan beam passes.
 * Uses Canvas rendering to avoid 448+ DOM nodes.
 */
export function PixelDecodeGrid({
  scanProgress,
  isOptimized,
  hasStarted,
  onFirstDraw,
}: PixelDecodeGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasNotifiedFirstDrawRef = useRef(false);

  // State refs for stable draw function access
  const stateRef = useRef<DrawState>({
    scanProgress,
    isOptimized,
    hasStarted,
    flashIntensity: 0,
  });

  // Update state ref on prop changes
  useEffect(() => {
    stateRef.current = {
      ...stateRef.current,
      scanProgress,
      isOptimized,
      hasStarted,
    };
  }, [scanProgress, isOptimized, hasStarted]);

  // Draw function (stable reference)
  const draw = useCallback((): void => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    if (containerWidth <= 0 || containerHeight <= 0) return;

    const dpr = window.devicePixelRatio || 1;

    syncCanvasToContainer(canvas, ctx, containerWidth, containerHeight, dpr);
    ctx.clearRect(0, 0, containerWidth, containerHeight);

    const layout = getCanvasLayout(containerWidth, containerHeight);
    const state = stateRef.current;
    const currentScanRow = (state.scanProgress / 100) * GRID_ROWS;

    // Draw all blocks
    for (const block of PIXEL_BLOCKS) {
      drawBlock({
        ctx,
        block,
        layout,
        state,
        textBounds: TEXT_ROW_BOUNDS,
        currentScanRow,
      });
    }

    // Notify first draw
    if (!hasNotifiedFirstDrawRef.current) {
      hasNotifiedFirstDrawRef.current = true;
      if (onFirstDraw !== undefined) onFirstDraw();
    }

    // Draw scan beam (continues past 100% to exit off-screen)
    if (!state.hasStarted) return;

    // Calculate if beam is still visible (using progress beyond 100 for exit)
    const beamY = (state.scanProgress / 100) * containerHeight;
    const beamHalfHeight = 30; // Half of BEAM_HEIGHT_PX in canvas-utils
    const beamIsVisible = beamY - beamHalfHeight < containerHeight;

    if (!beamIsVisible) return;

    drawScanBeam({
      ctx,
      containerWidth,
      containerHeight,
      scanProgress: state.scanProgress,
    });
  }, [onFirstDraw]);

  // Flash animation handler
  const handleFlashFrame = useCallback(
    (intensity: number): void => {
      stateRef.current = { ...stateRef.current, flashIntensity: intensity };
      draw();
    },
    [draw],
  );

  useFlashAnimation({
    isTriggered: isOptimized,
    delayMs: OPTIMIZATION_HIGHLIGHT_DELAY_MS,
    onFrame: handleFlashFrame,
  });

  // Redraw on state changes
  useLayoutEffect(() => {
    draw();
  }, [draw, scanProgress, isOptimized, hasStarted]);

  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      draw();
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [draw]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
