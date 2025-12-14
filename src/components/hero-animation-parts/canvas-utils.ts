import { accentRgba, GRID_COLS, GRID_ROWS } from "./constants";

// ============================================================================
// Types
// ============================================================================

export type CanvasLayout = {
  readonly padding: number;
  readonly gap: number;
  readonly cellWidth: number;
  readonly cellHeight: number;
};

export type TextRowBounds = {
  readonly minRow: number;
  readonly maxRow: number;
};

// ============================================================================
// Layout Calculations
// ============================================================================

/**
 * Calculates the canvas layout based on container dimensions.
 */
export function getCanvasLayout(
  containerWidth: number,
  containerHeight: number,
): CanvasLayout {
  const padding = 8;
  const gap = 1;
  const cellWidth =
    (containerWidth - padding * 2 - gap * (GRID_COLS - 1)) / GRID_COLS;
  const cellHeight =
    (containerHeight - padding * 2 - gap * (GRID_ROWS - 1)) / GRID_ROWS;

  return { padding, gap, cellWidth, cellHeight };
}

/**
 * Syncs canvas dimensions to container with device pixel ratio support.
 */
export function syncCanvasToContainer(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  containerWidth: number,
  containerHeight: number,
  dpr: number,
): void {
  // Set canvas size with device pixel ratio for sharpness
  if (
    canvas.width !== containerWidth * dpr ||
    canvas.height !== containerHeight * dpr
  ) {
    canvas.width = containerWidth * dpr;
    canvas.height = containerHeight * dpr;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${containerHeight}px`;
    ctx.scale(dpr, dpr);
    return;
  }

  // Keep transform stable across redraws
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// ============================================================================
// Drawing Utilities
// ============================================================================

/**
 * Clamps a value between 0 and 1.
 */
export function clamp01(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

type GlowRectOptions = {
  readonly ctx: CanvasRenderingContext2D;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly color: string;
  readonly blur: number;
};

/**
 * Draws a filled rectangle with a shadow/glow effect.
 */
export function drawGlowRect(options: GlowRectOptions): void {
  const { ctx, x, y, width, height, color, blur } = options;
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.fillRect(x, y, width, height);
}

type WebpGlowOptions = {
  readonly ctx: CanvasRenderingContext2D;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly flashIntensity: number;
};

/**
 * Draws a glow effect for WebP letter cells.
 *
 * Uses inset rendering to prevent glow bleeding into adjacent cells.
 */
export function drawWebpGlow(options: WebpGlowOptions): void {
  const intensity = clamp01(options.flashIntensity);
  if (intensity <= 0.001) return;

  const { ctx } = options;
  ctx.save();

  // Inset to avoid edge anti-aliasing bleeding
  const inset = Math.min(1, Math.min(options.width, options.height) * 0.18);
  const x = options.x + inset;
  const y = options.y + inset;
  const width = Math.max(0, options.width - inset * 2);
  const height = Math.max(0, options.height - inset * 2);

  if (width <= 0 || height <= 0) {
    ctx.restore();
    return;
  }

  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const radius = Math.max(width, height) * 0.9;

  // Soft inner glow (radial gradient)
  const radial = ctx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    radius,
  );
  radial.addColorStop(0, accentRgba(clamp01(1.15 * intensity)));
  radial.addColorStop(0.55, accentRgba(clamp01(0.55 * intensity)));
  radial.addColorStop(1, "transparent");
  ctx.fillStyle = radial;
  ctx.fillRect(x, y, width, height);

  // Bright core (additive blending)
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = accentRgba(clamp01(0.48 * intensity));
  ctx.fillRect(x, y, width, height);

  ctx.restore();
}

// ============================================================================
// Scan Beam
// ============================================================================

/** Scan beam styling constants */
const BEAM_HEIGHT_PX = 60;
const BEAM_LINE_HEIGHT_PX = 2;
const BEAM_OFFSET_PX = BEAM_HEIGHT_PX / 2;

type DrawScanBeamOptions = {
  readonly ctx: CanvasRenderingContext2D;
  readonly containerWidth: number;
  readonly containerHeight: number;
  readonly scanProgress: number;
};

/**
 * Draws the scanning beam (gradient band + bright line + glow).
 */
export function drawScanBeam(options: DrawScanBeamOptions): void {
  const { ctx, containerWidth, containerHeight, scanProgress } = options;

  // Map scan progress to the full container height
  const beamCenterY = (scanProgress / 100) * containerHeight;
  const beamTop = beamCenterY - BEAM_OFFSET_PX;

  ctx.save();

  // Beam gradient background
  const beamGradient = ctx.createLinearGradient(
    0,
    beamTop,
    0,
    beamTop + BEAM_HEIGHT_PX,
  );
  beamGradient.addColorStop(0, "rgba(16, 185, 129, 0)");
  beamGradient.addColorStop(0.5, "rgba(16, 185, 129, 0.3)");
  beamGradient.addColorStop(1, "rgba(16, 185, 129, 0)");
  ctx.fillStyle = beamGradient;

  const visibleBeamTop = Math.max(0, beamTop);
  const visibleBeamBottom = Math.min(containerHeight, beamTop + BEAM_HEIGHT_PX);
  const visibleBeamHeight = visibleBeamBottom - visibleBeamTop;

  if (visibleBeamHeight > 0) {
    ctx.fillRect(0, visibleBeamTop, containerWidth, visibleBeamHeight);
  }

  // Beam line with glow
  ctx.beginPath();
  ctx.moveTo(0, beamCenterY);
  ctx.lineTo(containerWidth, beamCenterY);
  ctx.lineWidth = BEAM_LINE_HEIGHT_PX;
  ctx.strokeStyle = "rgba(16, 185, 129, 0.6)";
  ctx.shadowColor = "rgba(16, 185, 129, 0.8)";
  ctx.shadowBlur = 15;
  ctx.stroke();

  // Crisp line on top
  ctx.shadowBlur = 0;
  ctx.stroke();

  ctx.restore();
}
