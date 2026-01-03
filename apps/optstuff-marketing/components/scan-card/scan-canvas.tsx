"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  drawRoundedRect,
  drawLandscape,
  drawStatusBadge,
  drawFileSizeDisplay,
} from "./canvas-utils.js";
import { useScanAnimation } from "@/components/scan-card/use-scan-animation";

type AnimationState = {
  readonly scanProgress: number;
  readonly isOptimized: boolean;
  readonly isScanning: boolean;
  readonly opacity: number;
  readonly wasOptimizing: boolean;
  readonly transitionStartTime: number;
  readonly pauseStartTime: number;
};

type ScanCanvasProps = {
  readonly width: number;
  readonly height: number;
  readonly autoPlay: boolean;
  readonly savingsPercent: number;
  readonly scanDuration: number;
  readonly pauseDuration: number;
  readonly originalSize: number;
  readonly onReady?: () => void;
};

/**
 * 掃描動畫 Canvas 組件
 */
export function ScanCanvas({
  width,
  height,
  autoPlay,
  savingsPercent,
  scanDuration,
  pauseDuration,
  originalSize,
  onReady,
}: ScanCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasDrawnRef = useRef(false);

  // === 常數定義 ===
  const imgPadding = 10;
  const imgX = imgPadding;
  const imgY = imgPadding;
  const imgW = width - imgPadding * 2;
  const imgH = height - imgPadding * 2;
  const cardRadius = 10;
  const imgRadius = 6;

  // 設置 canvas 大小
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
  }, [width, height]);

  // 動畫邏輯
  const handleFrame = useCallback(
    ({
      scanProgress,
      isOptimized,
      isScanning,
      opacity,
      wasOptimizing,
      transitionStartTime,
      pauseStartTime,
    }: AnimationState) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);

      // 通知父組件 canvas 已準備好（僅第一次）
      if (!hasDrawnRef.current && onReady) {
        hasDrawnRef.current = true;
        onReady();
      }

      const now = Date.now();

      // === 背景效果 ===
      const bgGradient = ctx.createRadialGradient(
        width * 0.5,
        height * 0.3,
        0,
        width * 0.5,
        height * 0.3,
        width * 0.7,
      );
      bgGradient.addColorStop(0, `rgba(16, 185, 129, ${opacity * 0.03})`);
      bgGradient.addColorStop(1, "rgba(16, 185, 129, 0)");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // 細微網格
      ctx.strokeStyle = "rgba(16, 185, 129, 0.015)";
      ctx.lineWidth = 0.5;
      for (let i = 1; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo((width / 8) * i, 0);
        ctx.lineTo((width / 8) * i, height);
        ctx.stroke();
      }
      for (let i = 1; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(0, (height / 6) * i);
        ctx.lineTo(width, (height / 6) * i);
        ctx.stroke();
      }

      // === 卡片容器 ===
      const cardPath = new Path2D();
      cardPath.moveTo(cardRadius, 0);
      cardPath.lineTo(width - cardRadius, 0);
      cardPath.quadraticCurveTo(width, 0, width, cardRadius);
      cardPath.lineTo(width, height - cardRadius);
      cardPath.quadraticCurveTo(width, height, width - cardRadius, height);
      cardPath.lineTo(cardRadius, height);
      cardPath.quadraticCurveTo(0, height, 0, height - cardRadius);
      cardPath.lineTo(0, cardRadius);
      cardPath.quadraticCurveTo(0, 0, cardRadius, 0);
      cardPath.closePath();

      // 背景
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.03})`;
      ctx.fill(cardPath);

      // === 圖片區域 ===
      ctx.save();
      ctx.beginPath();
      drawRoundedRect(ctx, imgX, imgY, imgW, imgH, imgRadius);
      ctx.clip();

      const scanLineY = imgY + (imgH * scanProgress) / 100;

      if (isScanning) {
        drawLandscape({
          ctx,
          imgX,
          imgY,
          imgW,
          imgH,
          baseOpacity: opacity,
          blurLevel: 0,
        });

        if (scanProgress > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(imgX, imgY, imgW, scanLineY - imgY);
          ctx.clip();
          drawLandscape({
            ctx,
            imgX,
            imgY,
            imgW,
            imgH,
            baseOpacity: opacity * 0.85,
            blurLevel: 1.0,
          });
          ctx.restore();
        }
      } else if (isOptimized) {
        drawLandscape({
          ctx,
          imgX,
          imgY,
          imgW,
          imgH,
          baseOpacity: opacity,
          blurLevel: 1.0,
        });
      } else {
        drawLandscape({
          ctx,
          imgX,
          imgY,
          imgW,
          imgH,
          baseOpacity: opacity,
          blurLevel: 0,
        });
      }

      ctx.restore();

      // === 檔案大小顯示（圖片正中） ===
      const centerX = imgX + imgW / 2;
      const centerY = imgY + imgH / 2;
      const currentSize = isOptimized
        ? Math.round(originalSize * (1 - savingsPercent / 100))
        : Math.round(originalSize * (1 - scanProgress * 0.0065));

      drawFileSizeDisplay({
        ctx,
        centerX,
        centerY,
        currentSize,
        isOptimized,
        savingsPercent,
      });

      // === 狀態標籤 ===
      const labelY = imgY + 12;
      const labelRightMargin = 4;
      const transitionDuration = 300;
      const isTransitioning =
        wasOptimizing &&
        isOptimized &&
        now - transitionStartTime < transitionDuration;

      if (isScanning || isOptimized) {
        const badgeOpacity = 0.9;

        if (isTransitioning) {
          const transitionProgress =
            (now - transitionStartTime) / transitionDuration;
          const fadeOut = 1 - transitionProgress;
          const fadeIn = transitionProgress;

          // BLURRING（淡出）
          drawStatusBadge({
            ctx,
            text: "BLURRING",
            x: imgX + imgW - 42 - labelRightMargin,
            y: labelY - 5,
            width: 42,
            height: 13,
            opacity: badgeOpacity * fadeOut,
          });

          // BLURRED（淡入）
          drawStatusBadge({
            ctx,
            text: "BLURRED",
            x: imgX + imgW - 38 - labelRightMargin,
            y: labelY - 5,
            width: 38,
            height: 13,
            opacity: badgeOpacity * fadeIn,
          });
        } else {
          const labelText = isOptimized ? "BLURRED" : "BLURRING";
          const labelWidth = isOptimized ? 38 : 42;
          drawStatusBadge({
            ctx,
            text: labelText,
            x: imgX + imgW - labelWidth - labelRightMargin,
            y: labelY - 5,
            width: labelWidth,
            height: 13,
            opacity: badgeOpacity,
          });
        }
      }

      // === 掃描光束 ===
      if (isScanning) {
        const beamY = scanLineY;
        const beamGradient = ctx.createLinearGradient(
          0,
          beamY - 12,
          0,
          beamY + 12,
        );
        beamGradient.addColorStop(0, "rgba(16, 185, 129, 0)");
        beamGradient.addColorStop(0.5, "rgba(16, 185, 129, 0.35)");
        beamGradient.addColorStop(1, "rgba(16, 185, 129, 0)");
        ctx.fillStyle = beamGradient;
        ctx.fillRect(imgX, beamY - 12, imgW, 24);

        ctx.strokeStyle = "rgba(16, 185, 129, 0.7)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(imgX, beamY);
        ctx.lineTo(imgX + imgW, beamY);
        ctx.stroke();

        ctx.shadowColor = "rgba(16, 185, 129, 0.9)";
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // === 優化完成閃光 ===
      if (isOptimized) {
        const flashProgress = (now - pauseStartTime) / 300;
        if (flashProgress < 1) {
          const flashOpacity = (1 - flashProgress) * 0.15;
          ctx.fillStyle = `rgba(16, 185, 129, ${flashOpacity})`;
          ctx.beginPath();
          drawRoundedRect(ctx, imgX, imgY, imgW, imgH, imgRadius);
          ctx.fill();
        }
      }
    },
    [
      width,
      height,
      imgX,
      imgY,
      imgW,
      imgH,
      imgRadius,
      cardRadius,
      originalSize,
      savingsPercent,
      scanDuration,
      pauseDuration,
    ],
  );

  useScanAnimation({
    autoPlay,
    scanDuration,
    pauseDuration,
    onFrame: handleFrame,
  });

  return <canvas ref={canvasRef} className="m-0 block p-0" />;
}
