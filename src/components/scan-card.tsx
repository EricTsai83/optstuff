"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ScanCanvas } from "./scan-card/scan-canvas";
import { ScanSkeleton } from "./scan-card/scan-skeleton";

type ScanCardProps = {
  readonly format: string;
  readonly originalSize: number;
  readonly width?: number;
  readonly height?: number;
  /** 是否自動播放掃描動畫（循環） */
  readonly autoPlay?: boolean;
  readonly savingsPercent?: number;
  /** 掃描持續時間（毫秒） */
  readonly scanDuration?: number;
  /** 掃描完成後等待時間（毫秒） */
  readonly pauseDuration?: number;
  readonly className?: string;
};

/**
 * 圖片優化掃描卡片組件
 * 清晰圖片 → 模糊效果
 */
export function ScanCard({
  format,
  originalSize,
  width = 300,
  height = 220,
  autoPlay = true,
  savingsPercent = 65,
  scanDuration = 2000,
  pauseDuration = 1500,
  className = "",
}: ScanCardProps) {
  const [isCanvasReady, setIsCanvasReady] = useState(false);

  const handleCanvasReady = useCallback((): void => {
    setIsCanvasReady(true);
  }, []);

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden rounded-lg border-[1.5px] border-emerald-500/40",
        className,
      )}
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      {/* Skeleton - 等 canvas 浮現動畫完成後再消失 */}
      <div
        className={cn(
          "absolute inset-0",
          isCanvasReady ? "animate-skeleton-fade-out" : "",
        )}
      >
        <ScanSkeleton />
      </div>

      {/* Canvas - 浮現動畫 */}
      <div
        className={cn(
          "absolute inset-0",
          isCanvasReady ? "animate-canvas-fade-in" : "opacity-0",
        )}
      >
        <ScanCanvas
          width={width}
          height={height}
          autoPlay={autoPlay}
          savingsPercent={savingsPercent}
          scanDuration={scanDuration}
          pauseDuration={pauseDuration}
          originalSize={originalSize}
          onReady={handleCanvasReady}
        />
      </div>
    </div>
  );
}
