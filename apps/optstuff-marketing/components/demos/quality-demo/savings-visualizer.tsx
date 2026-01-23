"use client";

import { cn } from "@workspace/ui/lib/utils";
import {
  Calculator,
  ChevronDown,
  HardDrive,
  ImageIcon,
  TrendingDown,
  Wifi,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

type SavingsVisualizerProps = {
  readonly savedPercentage: number;
  readonly savedKB: number;
  readonly imageCount: number;
  readonly originalSizeKB: number;
  readonly optimizedSizeKB: number;
};

function formatFileSize(kb: number): string {
  if (kb < 1024) return `${Math.round(kb)} KB`;
  if (kb < 1024 * 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${(kb / (1024 * 1024)).toFixed(2)} GB`;
}

function formatTime(seconds: number): string {
  if (seconds < 0.1) return `${Math.round(seconds * 1000)}ms`;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  return `${(seconds / 60).toFixed(1)}m`;
}

function calculateLoadTime(sizeKB: number, speedMbps: number): number {
  return sizeKB / 1024 / (speedMbps / 8);
}

type TrendIconProps = {
  readonly isRising: boolean;
  readonly isShaking: boolean;
  readonly className?: string;
};

function TrendIcon({ isRising, isShaking, className = "" }: TrendIconProps) {
  return (
    <span
      className={cn(
        "inline-flex transition-transform duration-300",
        isRising && "-scale-x-100 -rotate-180",
      )}
    >
      <TrendingDown className={cn(className, isShaking && "animate-shake")} />
    </span>
  );
}

export function SavingsVisualizer({
  savedPercentage,
  savedKB,
  imageCount,
  originalSizeKB,
  optimizedSizeKB,
}: SavingsVisualizerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isRising, setIsRising] = useState(false);
  const prevPercentageRef = useRef(savedPercentage);
  const shakeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const totalOriginalKB = originalSizeKB * imageCount;
  const totalOptimizedKB = optimizedSizeKB * imageCount;
  const totalSavedKB = savedKB * imageCount;

  const timeSaved3G =
    calculateLoadTime(totalOriginalKB, 2) -
    calculateLoadTime(totalOptimizedKB, 2);
  const timeSaved4G =
    calculateLoadTime(totalOriginalKB, 10) -
    calculateLoadTime(totalOptimizedKB, 10);
  const timeSaved5G =
    calculateLoadTime(totalOriginalKB, 100) -
    calculateLoadTime(totalOptimizedKB, 100);

  useEffect(() => {
    const prevValue = prevPercentageRef.current;
    const currentValue = savedPercentage;

    if (prevValue !== currentValue) {
      const isCostRising = currentValue < prevValue;

      if (isCostRising) {
        setIsRising(true);
        setIsShaking(true);
      } else {
        setIsRising(false);
        setIsShaking(false);
      }

      prevPercentageRef.current = currentValue;

      if (shakeTimeoutRef.current) {
        clearTimeout(shakeTimeoutRef.current);
      }

      if (isCostRising) {
        shakeTimeoutRef.current = setTimeout(() => {
          setIsShaking(false);
          setIsRising(false);
        }, 600);
      }
    }

    return () => {
      if (shakeTimeoutRef.current) {
        clearTimeout(shakeTimeoutRef.current);
      }
    };
  }, [savedPercentage]);

  const trendColorClass = isRising
    ? "text-red-500 dark:text-red-400"
    : "text-accent dark:text-accent";
  const trendBgClass = isRising
    ? "bg-red-100 dark:bg-red-500/20"
    : "bg-accent/10 dark:bg-accent/20";
  const iconColorClass = isRising ? "text-red-500" : "text-accent";

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/2">
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsExpanded((prev) => !prev);
          }
        }}
        className="flex cursor-pointer items-center justify-between px-4 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calculator className="text-muted-foreground h-4 w-4" />
            <span className="text-sm font-medium">Savings Calculator</span>
          </div>
          <span className="text-muted-foreground text-xs">
            ({imageCount.toLocaleString()} images)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-colors duration-500 ease-in-out",
              trendBgClass,
            )}
          >
            <TrendIcon
              isRising={isRising}
              isShaking={isShaking}
              className={cn(
                "h-3.5 w-3.5 transition-colors duration-500 ease-in-out",
                trendColorClass,
              )}
            />
            <span
              className={cn(
                "font-mono text-sm font-bold transition-colors duration-500 ease-in-out",
                trendColorClass,
              )}
            >
              {savedPercentage}%
            </span>
          </div>
          <ChevronDown
            className={cn(
              "text-muted-foreground h-4 w-4 transition-transform duration-200",
              isExpanded && "rotate-180",
            )}
          />
        </div>
      </div>

      {/* Expandable Content */}
      <div
        className={cn(
          "grid transition-all duration-300 ease-out",
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-gray-100 p-3 dark:border-white/5">
            {/* Size Comparison */}
            <div className="mb-3">
              <p className="text-muted-foreground mb-2 text-center text-[10px] tracking-wider uppercase">
                Total Size Comparison
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <p className="text-muted-foreground mb-0.5 text-[10px]">
                    Before
                  </p>
                  <p className="font-mono text-lg font-semibold text-gray-400 tabular-nums line-through">
                    {formatFileSize(totalOriginalKB)}
                  </p>
                </div>
                <div className="text-muted-foreground">→</div>
                <div className="text-center">
                  <p
                    className={cn(
                      "mb-0.5 text-[10px] transition-colors duration-500 ease-in-out",
                      trendColorClass,
                    )}
                  >
                    After
                  </p>
                  <p
                    className={cn(
                      "font-mono text-lg font-semibold tabular-nums transition-colors duration-500 ease-in-out",
                      trendColorClass,
                    )}
                  >
                    {formatFileSize(totalOptimizedKB)}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="relative h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500 ease-in-out",
                    isRising ? "bg-red-500" : "bg-accent",
                  )}
                  style={{ width: `${100 - savedPercentage}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[10px]">
                <span
                  className={cn(
                    "transition-colors duration-500 ease-in-out",
                    trendColorClass,
                  )}
                >
                  Optimized
                </span>
                <span className="text-muted-foreground">
                  {savedPercentage}% reduced
                </span>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-5 gap-2">
              <StatItem
                icon={<ImageIcon className="text-muted-foreground h-3 w-3" />}
                label="Per Image"
                value={formatFileSize(savedKB)}
                isRising={isRising}
                isShaking={isShaking}
                iconColorClass={iconColorClass}
              />
              <StatItem
                icon={<HardDrive className="text-muted-foreground h-3 w-3" />}
                label="Saved"
                value={formatFileSize(totalSavedKB)}
                isRising={isRising}
                isShaking={isShaking}
                iconColorClass={iconColorClass}
              />
              <StatItem
                icon={<Wifi className="text-muted-foreground h-3 w-3" />}
                label="3G Load"
                value={formatTime(timeSaved3G)}
                isRising={isRising}
                isShaking={isShaking}
                iconColorClass={iconColorClass}
              />
              <StatItem
                icon={<Wifi className="text-muted-foreground h-3 w-3" />}
                label="4G Load"
                value={formatTime(timeSaved4G)}
                isRising={isRising}
                isShaking={isShaking}
                iconColorClass={iconColorClass}
              />
              <StatItem
                icon={<Wifi className="text-muted-foreground h-3 w-3" />}
                label="5G Load"
                value={formatTime(timeSaved5G)}
                isRising={isRising}
                isShaking={isShaking}
                iconColorClass={iconColorClass}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type StatItemProps = {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly value: string;
  readonly isRising: boolean;
  readonly isShaking: boolean;
  readonly iconColorClass: string;
};

function StatItem({
  icon,
  label,
  value,
  isRising,
  isShaking,
  iconColorClass,
}: StatItemProps) {
  return (
    <div className="rounded-lg bg-gray-50 p-2.5 text-center dark:bg-white/5">
      <div className="mb-1 flex items-center justify-center gap-1">
        {icon}
        <span className="text-muted-foreground text-[9px] uppercase">
          {label}
        </span>
      </div>
      <div className="flex items-center justify-center gap-1">
        <TrendIcon
          isRising={isRising}
          isShaking={isShaking}
          className={cn(
            "h-3 w-3 transition-colors duration-500 ease-in-out",
            iconColorClass,
          )}
        />
        <span className="font-mono text-sm font-bold tabular-nums">
          {value}
        </span>
      </div>
    </div>
  );
}
