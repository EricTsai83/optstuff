"use client";

import { useEffect, useRef, useState } from "react";

type ImageFormat = "WebP" | "AVIF" | "JPEG" | "PNG";

type ImageOptimizationCardProps = {
  readonly format?: ImageFormat;
  readonly originalSize?: number;
  readonly className?: string;
};

const ANIMATION_DURATION = 2400; // 動畫時長 (ms)
const PAUSE_DURATION = 1000; // 100% 時停留時長 (ms)

export function ImageOptimizationCard({
  format = "WebP",
  originalSize = 1024,
  className = "",
}: ImageOptimizationCardProps) {
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const isPausedRef = useRef(false);

  // 壓縮後大小：從 100% 降到 30%
  const optimizedSize = Math.round(
    (originalSize * (100 - progress * 0.7)) / 100,
  );

  useEffect(() => {
    let rafId: number;

    const animate = (timestamp: number): void => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;

      if (isPausedRef.current) {
        // 暫停期間
        if (elapsed >= PAUSE_DURATION) {
          isPausedRef.current = false;
          startTimeRef.current = timestamp;
          setProgress(0);
        }
      } else {
        // 動畫進行中
        const newProgress = Math.min((elapsed / ANIMATION_DURATION) * 100, 100);
        setProgress(newProgress);

        if (newProgress >= 100) {
          isPausedRef.current = true;
          startTimeRef.current = timestamp;
        }
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      className={`relative flex h-20 w-24 flex-col items-center justify-between rounded-lg border border-emerald-500/30 bg-white/5 p-2 backdrop-blur-sm ${className}`}
    >
      {/* Format badge */}
      <span className="text-[10px] font-bold tracking-wide text-emerald-500">
        {format}
      </span>

      {/* Progress bar */}
      <div className="h-1 w-[70%] overflow-hidden rounded-full bg-emerald-500/20">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* File size */}
      <span className="font-mono text-[9px] text-emerald-500/80">
        {optimizedSize}KB
      </span>
    </div>
  );
}
