/**
 * Canvas drawing utility functions
 */

type CanvasContext = CanvasRenderingContext2D;

/**
 * Manually draw a rounded rectangle
 */
export const drawRoundedRect = (
  ctx: CanvasContext,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

type DrawLandscapeParams = {
  readonly ctx: CanvasContext;
  readonly imgX: number;
  readonly imgY: number;
  readonly imgW: number;
  readonly imgH: number;
  readonly baseOpacity: number;
  readonly blurLevel: number;
};

/**
 * Draw landscape image (with controllable blur level)
 */
export const drawLandscape = ({
  ctx,
  imgX,
  imgY,
  imgW,
  imgH,
  baseOpacity,
  blurLevel,
}: DrawLandscapeParams): void => {
  // Sky gradient
  const skyGradient = ctx.createLinearGradient(
    imgX,
    imgY,
    imgX,
    imgY + imgH * 0.5,
  );
  skyGradient.addColorStop(0, `rgba(16, 185, 129, ${baseOpacity * 0.12})`);
  skyGradient.addColorStop(1, `rgba(16, 185, 129, ${baseOpacity * 0.2})`);
  ctx.fillStyle = skyGradient;
  ctx.fillRect(imgX, imgY, imgW, imgH * 0.5);

  // Ground gradient
  const groundGradient = ctx.createLinearGradient(
    imgX,
    imgY + imgH * 0.5,
    imgX,
    imgY + imgH,
  );
  groundGradient.addColorStop(0, `rgba(16, 185, 129, ${baseOpacity * 0.18})`);
  groundGradient.addColorStop(1, `rgba(16, 185, 129, ${baseOpacity * 0.28})`);
  ctx.fillStyle = groundGradient;
  ctx.fillRect(imgX, imgY + imgH * 0.5, imgW, imgH * 0.5);

  // Sun
  const sunX = imgX + imgW * 0.75;
  const sunY = imgY + imgH * 0.28;
  const sunRadius = 11;
  const glowRadius = 26;

  // Sun glow
  const actualGlowRadius = glowRadius + blurLevel * 20;
  const sunGlow = ctx.createRadialGradient(
    sunX,
    sunY,
    0,
    sunX,
    sunY,
    actualGlowRadius,
  );
  sunGlow.addColorStop(0, `rgba(16, 185, 129, ${baseOpacity * 0.45})`);
  sunGlow.addColorStop(0.4, `rgba(16, 185, 129, ${baseOpacity * 0.2})`);
  sunGlow.addColorStop(1, `rgba(16, 185, 129, 0)`);
  ctx.fillStyle = sunGlow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, actualGlowRadius, 0, Math.PI * 2);
  ctx.fill();

  // Sun body
  if (blurLevel > 0) {
    const blurExpand = blurLevel * 9;
    const sunBody = ctx.createRadialGradient(
      sunX,
      sunY,
      0,
      sunX,
      sunY,
      sunRadius + blurExpand,
    );
    sunBody.addColorStop(0, `rgba(16, 185, 129, ${baseOpacity * 0.5})`);
    sunBody.addColorStop(0.5, `rgba(16, 185, 129, ${baseOpacity * 0.4})`);
    sunBody.addColorStop(0.8, `rgba(16, 185, 129, ${baseOpacity * 0.25})`);
    sunBody.addColorStop(1, `rgba(16, 185, 129, ${baseOpacity * 0.08})`);
    ctx.fillStyle = sunBody;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius + blurExpand, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = `rgba(16, 185, 129, ${baseOpacity * 0.55})`;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Mountain 1
  const m1BaseOpacity = blurLevel > 0 ? baseOpacity * 0.25 : baseOpacity * 0.4;
  const mountain1Gradient = ctx.createLinearGradient(
    imgX,
    imgY + imgH * 0.4,
    imgX,
    imgY + imgH,
  );
  mountain1Gradient.addColorStop(0, `rgba(16, 185, 129, ${m1BaseOpacity})`);
  mountain1Gradient.addColorStop(
    1,
    `rgba(16, 185, 129, ${m1BaseOpacity + 0.05})`,
  );
  ctx.fillStyle = mountain1Gradient;
  ctx.beginPath();
  ctx.moveTo(imgX, imgY + imgH);
  ctx.lineTo(imgX + imgW * 0.15, imgY + imgH);
  ctx.lineTo(imgX + imgW * 0.35, imgY + imgH * 0.38);
  ctx.lineTo(imgX + imgW * 0.55, imgY + imgH);
  ctx.closePath();
  ctx.fill();

  // Mountain 1 blur softening
  if (blurLevel > 0) {
    const layers = [
      { offset: 8, opacity: 0.06 },
      { offset: 6, opacity: 0.08 },
      { offset: 4, opacity: 0.1 },
      { offset: 2, opacity: 0.12 },
    ];
    layers.forEach((layer) => {
      ctx.fillStyle = `rgba(16, 185, 129, ${baseOpacity * blurLevel * layer.opacity})`;
      ctx.beginPath();
      ctx.moveTo(imgX - layer.offset, imgY + imgH);
      ctx.lineTo(imgX + imgW * 0.15 - (layer.offset - 1), imgY + imgH);
      ctx.lineTo(imgX + imgW * 0.35, imgY + imgH * (0.38 - layer.offset / 100));
      ctx.lineTo(imgX + imgW * 0.55 + (layer.offset - 1), imgY + imgH);
      ctx.closePath();
      ctx.fill();
    });
  }

  // Mountain 2
  const m2BaseOpacity = blurLevel > 0 ? baseOpacity * 0.2 : baseOpacity * 0.33;
  const mountain2Gradient = ctx.createLinearGradient(
    imgX,
    imgY + imgH * 0.5,
    imgX,
    imgY + imgH,
  );
  mountain2Gradient.addColorStop(0, `rgba(16, 185, 129, ${m2BaseOpacity})`);
  mountain2Gradient.addColorStop(
    1,
    `rgba(16, 185, 129, ${m2BaseOpacity + 0.05})`,
  );
  ctx.fillStyle = mountain2Gradient;
  ctx.beginPath();
  ctx.moveTo(imgX + imgW * 0.35, imgY + imgH);
  ctx.lineTo(imgX + imgW * 0.55, imgY + imgH * 0.48);
  ctx.lineTo(imgX + imgW * 0.75, imgY + imgH);
  ctx.closePath();
  ctx.fill();

  // Mountain 2 blur softening
  if (blurLevel > 0) {
    const layers = [
      { offset: 4, opacity: 0.05 },
      { offset: 3, opacity: 0.07 },
      { offset: 2, opacity: 0.09 },
      { offset: 1, opacity: 0.11 },
    ];
    layers.forEach((layer) => {
      ctx.fillStyle = `rgba(16, 185, 129, ${baseOpacity * blurLevel * layer.opacity})`;
      ctx.beginPath();
      ctx.moveTo(imgX + imgW * 0.35 - layer.offset, imgY + imgH);
      ctx.lineTo(imgX + imgW * 0.55, imgY + imgH * (0.48 - layer.offset / 100));
      ctx.lineTo(imgX + imgW * 0.75 + layer.offset, imgY + imgH);
      ctx.closePath();
      ctx.fill();
    });
  }

  // Mountain 3
  const m3BaseOpacity = blurLevel > 0 ? baseOpacity * 0.18 : baseOpacity * 0.28;
  ctx.fillStyle = `rgba(16, 185, 129, ${m3BaseOpacity})`;
  ctx.beginPath();
  ctx.moveTo(imgX + imgW * 0.6, imgY + imgH);
  ctx.lineTo(imgX + imgW * 0.82, imgY + imgH * 0.52);
  ctx.lineTo(imgX + imgW, imgY + imgH);
  ctx.closePath();
  ctx.fill();

  // Mountain 3 blur softening
  if (blurLevel > 0) {
    const layers = [
      { offset: 6, opacity: 0.04 },
      { offset: 4, opacity: 0.06 },
      { offset: 2, opacity: 0.08 },
      { offset: 1, opacity: 0.1 },
    ];
    layers.forEach((layer) => {
      ctx.fillStyle = `rgba(16, 185, 129, ${baseOpacity * blurLevel * layer.opacity})`;
      ctx.beginPath();
      ctx.moveTo(imgX + imgW * 0.6 - layer.offset, imgY + imgH);
      ctx.lineTo(imgX + imgW * 0.82, imgY + imgH * (0.52 - layer.offset / 100));
      ctx.lineTo(imgX + imgW + layer.offset, imgY + imgH);
      ctx.closePath();
      ctx.fill();
    });
  }

  // Overall fog effect
  if (blurLevel > 0) {
    ctx.fillStyle = `rgba(16, 185, 129, ${blurLevel * 0.07})`;
    ctx.fillRect(imgX, imgY, imgW, imgH);
  }
};

type DrawStatusBadgeParams = {
  readonly ctx: CanvasContext;
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly opacity: number;
};

/**
 * Draw status badge
 */
export const drawStatusBadge = ({
  ctx,
  text,
  x,
  y,
  width,
  height,
  opacity,
}: DrawStatusBadgeParams): void => {
  // Background
  ctx.fillStyle = `rgba(16, 185, 129, ${opacity * 0.2})`;
  drawRoundedRect(ctx, x, y, width, height, 3);
  ctx.fill();

  // Text
  ctx.fillStyle = `rgba(16, 185, 129, ${opacity * 0.9})`;
  ctx.font = "bold 7px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + width / 2, y + height / 2);
};

type DrawFileSizeDisplayParams = {
  readonly ctx: CanvasContext;
  readonly centerX: number;
  readonly centerY: number;
  readonly currentSize: number;
  readonly isOptimized: boolean;
  readonly savingsPercent: number;
};

/**
 * Draw file size display (centered on image)
 */
export const drawFileSizeDisplay = ({
  ctx,
  centerX,
  centerY,
  currentSize,
  isOptimized,
  savingsPercent,
}: DrawFileSizeDisplayParams): void => {
  const circleRadius = 55;

  // Background circle
  ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
  ctx.beginPath();
  ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
  ctx.fill();

  // Outer ring
  ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  if (isOptimized) {
    // Reduction percentage
    ctx.fillStyle = "rgba(16, 185, 129, 1)";
    ctx.font = "bold 24px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`-${savingsPercent}%`, centerX, centerY - 8);

    ctx.fillStyle = "rgba(16, 185, 129, 0.8)";
    ctx.font = "8px 'JetBrains Mono', monospace";
    ctx.fillText("FILE SIZE", centerX, centerY + 12);
  } else {
    // Current file size
    ctx.fillStyle = "rgba(16, 185, 129, 1)";
    ctx.font = "bold 22px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${currentSize}KB`, centerX, centerY - 8);

    ctx.fillStyle = "rgba(16, 185, 129, 0.8)";
    ctx.font = "8px 'JetBrains Mono', monospace";
    ctx.fillText("FILE SIZE", centerX, centerY + 12);
  }
};
