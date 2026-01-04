"use client";

import { useState, useCallback } from "react";
import { cn } from "@workspace/ui/lib/utils";
import { ScanCanvas } from "./scan-card/scan-canvas";
import { ScanSkeleton } from "./scan-card/scan-skeleton";

type ScanCardProps = {
  readonly originalSize: number;
  readonly width?: number;
  readonly height?: number;
  /** Whether to auto-play scan animation (loop) */
  readonly autoPlay?: boolean;
  readonly savingsPercent?: number;
  /** Scan duration in milliseconds */
  readonly scanDuration?: number;
  /** Pause duration after scan completes in milliseconds */
  readonly pauseDuration?: number;
  readonly className?: string;
};

/**
 * Image optimization scan card component
 * Clear image → Blur effect
 */
export function ScanCard({
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
      {/* Skeleton - fades out after canvas fade-in animation completes */}
      <div
        className={cn(
          "absolute inset-0",
          isCanvasReady ? "animate-skeleton-fade-out" : "",
        )}
      >
        <ScanSkeleton />
      </div>

      {/* Canvas - fade-in animation */}
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
