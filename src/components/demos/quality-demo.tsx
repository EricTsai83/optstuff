"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/code-block";
import { cn } from "@/lib/utils";
import { ORIGINAL_SIZE_KB, QUALITY_DEMO_IMAGE } from "./constants";
import {
  ImageIcon,
  Sparkles,
  TrendingDown,
  HardDrive,
  Wifi,
  Calculator,
  ChevronDown,
} from "lucide-react";
import { useEffect } from "react";
import { DemoHeader, ControlCard, DemoLayout, PreviewCard } from "./layouts";

export function QualityDemo() {
  const [quality, setQuality] = useState(80);
  const [imageCount, setImageCount] = useState(100);
  const [isHovering, setIsHovering] = useState(false);
  const [imagePos, setImagePos] = useState({ x: 0.5, y: 0.5 });
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const optimizedImageRef = useRef<HTMLImageElement | null>(null);

  const baseSize = ORIGINAL_SIZE_KB;
  // When quality is 100, should be the same size as original
  const estimatedSize =
    quality === 100 ? baseSize : Math.round((quality / 100) * baseSize * 0.8);
  const savedPercentage = Math.round((1 - estimatedSize / baseSize) * 100);

  const optimizedImageUrl = useMemo(() => {
    // When quality is 100, use the same parameters as original
    if (quality === 100) {
      return `/api/optimize/q_100,f_webp,w_800${QUALITY_DEMO_IMAGE}`;
    }
    const operations = [`q_${quality}`, "f_webp"];
    return `/api/optimize/${operations.join(",")}${QUALITY_DEMO_IMAGE}`;
  }, [quality]);

  const ipxSyntax = useMemo(() => {
    const operations = [`q_${quality}`];
    // Only show IPX syntax, don't expose the actual endpoint
    return `/${operations.join(",")}/image.webp`;
  }, [quality]);

  const originalImageUrl = useMemo(() => {
    return `/api/optimize/q_100,f_webp,w_800${QUALITY_DEMO_IMAGE}`;
  }, []);

  const handleMouseMove = useCallback(
    (
      e: React.MouseEvent<HTMLImageElement>,
      imageRef: React.RefObject<HTMLImageElement | null>,
    ) => {
      if (!imageRef.current) return;

      const img = imageRef.current;
      const imgRect = img.getBoundingClientRect();
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;

      if (naturalWidth === 0 || naturalHeight === 0) {
        const imgX = (e.clientX - imgRect.left) / imgRect.width;
        const imgY = (e.clientY - imgRect.top) / imgRect.height;
        setImagePos({
          x: Math.max(0, Math.min(1, imgX)),
          y: Math.max(0, Math.min(1, imgY)),
        });
        setIsHovering(true);
        return;
      }

      const containerAspect = imgRect.width / imgRect.height;
      const imageAspect = naturalWidth / naturalHeight;

      let displayedWidth: number;
      let displayedHeight: number;
      let offsetX: number;
      let offsetY: number;

      if (imageAspect > containerAspect) {
        displayedWidth = imgRect.width;
        displayedHeight = imgRect.width / imageAspect;
        offsetX = 0;
        offsetY = (imgRect.height - displayedHeight) / 2;
      } else {
        displayedWidth = imgRect.height * imageAspect;
        displayedHeight = imgRect.height;
        offsetX = (imgRect.width - displayedWidth) / 2;
        offsetY = 0;
      }

      const mouseX = e.clientX - imgRect.left;
      const mouseY = e.clientY - imgRect.top;

      if (
        mouseX < offsetX ||
        mouseX > offsetX + displayedWidth ||
        mouseY < offsetY ||
        mouseY > offsetY + displayedHeight
      ) {
        setIsHovering(false);
        return;
      }

      setIsHovering(true);

      const imgX = (mouseX - offsetX) / displayedWidth;
      const imgY = (mouseY - offsetY) / displayedHeight;

      setImagePos({
        x: Math.max(0, Math.min(1, imgX)),
        y: Math.max(0, Math.min(1, imgY)),
      });
    },
    [],
  );

  const handleMouseEnter = useCallback(() => {}, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    setImagePos({ x: 0.5, y: 0.5 });
  }, []);

  function handleQualityChange(values: number[]) {
    setQuality(values[0] ?? 80);
  }

  function handleImageCountChange(values: number[]) {
    setImageCount(values[0] ?? 100);
  }

  return (
    <div className="space-y-4">
      <DemoHeader
        icon={<Sparkles className="h-5 w-5" />}
        title="Quality Optimization"
        description="Fine-tune compression for the perfect balance between size and quality"
      />

      <DemoLayout controlsColSpan={2} previewColSpan={3}>
        {/* Controls */}
        <div className="space-y-4.5 lg:col-span-2">
          {/* Quality Slider */}
          <ControlCard>
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-sm font-medium">Quality Level</Label>
              <div className="rounded-lg bg-gray-100 px-3 py-0.5 dark:bg-white/10">
                <span className="font-mono text-lg font-bold">{quality}</span>
                <span className="text-muted-foreground ml-0.5 text-sm">%</span>
              </div>
            </div>

            <Slider
              value={[quality]}
              onValueChange={handleQualityChange}
              min={10}
              max={100}
              step={5}
              className="**:[[role=slider]]:border-2 **:[[role=slider]]:border-gray-300 **:[[role=slider]]:bg-linear-to-b **:[[role=slider]]:from-white **:[[role=slider]]:to-gray-100 **:[[role=slider]]:shadow-lg dark:**:[[role=slider]]:border-white"
            />

            <div className="text-muted-foreground mt-3 flex justify-between text-xs">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Smaller file
              </span>
              <span className="flex items-center gap-1">
                Higher quality
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
              </span>
            </div>
          </ControlCard>

          {/* Image Count Slider */}
          <ControlCard>
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-sm font-medium">Number of Images</Label>
              <div className="rounded-lg bg-gray-100 px-3 py-0.5 dark:bg-white/10">
                <span className="font-mono text-lg font-bold">
                  {imageCount.toLocaleString()}
                </span>
              </div>
            </div>

            <Slider
              value={[imageCount]}
              onValueChange={handleImageCountChange}
              min={1}
              max={10000}
              step={1}
              className="**:[[role=slider]]:border-2 **:[[role=slider]]:border-gray-300 **:[[role=slider]]:bg-linear-to-b **:[[role=slider]]:from-white **:[[role=slider]]:to-gray-100 **:[[role=slider]]:shadow-lg dark:**:[[role=slider]]:border-white"
            />

            <div className="text-muted-foreground mt-3 flex justify-between text-xs">
              <span>1 image</span>
              <span>10,000 images</span>
            </div>
          </ControlCard>

          {/* API URL */}
          <ControlCard>
            <Label className="mb-2 text-sm font-medium">API URL</Label>
            <CodeBlock code={ipxSyntax} />
          </ControlCard>
        </div>

        {/* Preview */}
        <div className="space-y-3 lg:col-span-3">
          <div className="relative grid grid-cols-2 gap-2.5">
            {/* Original */}
            <PreviewCard label="Original" badge={`${baseSize} KB`}>
              <ImageContainer
                imageUrl={originalImageUrl}
                label="Original"
                imageRef={originalImageRef}
                onMouseMove={(e) => handleMouseMove(e, originalImageRef)}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              />
            </PreviewCard>

            {/* Optimized */}
            <PreviewCard
              label="Optimized"
              badge={`${estimatedSize} KB`}
              variant="optimized"
            >
              <ImageContainer
                imageUrl={optimizedImageUrl}
                label="Optimized"
                imageRef={optimizedImageRef}
                onMouseMove={(e) => handleMouseMove(e, optimizedImageRef)}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              />
            </PreviewCard>

            {/* Magnifier */}
            <ComparisonMagnifier
              originalImageUrl={originalImageUrl}
              optimizedImageUrl={optimizedImageUrl}
              imagePos={imagePos}
              isVisible={isHovering}
              zoom={5}
              height={100}
            />
          </div>

          {/* Hover hint */}
          <p className="text-muted-foreground text-center text-xs">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Hover over images to compare details
          </p>

          {/* Stats */}
          <div className="flex gap-2.5">
            <StatCard
              value={`${estimatedSize} KB`}
              label="File Size"
              icon={<ImageIcon className="h-4 w-4" />}
            />
            <StatCard
              value={`${quality}%`}
              label="Quality"
              icon={<Sparkles className="h-4 w-4" />}
            />
            <StatCard
              value={`${savedPercentage}%`}
              label="Saved"
              icon={<TrendingDown className="h-4 w-4" />}
              highlight
            />
          </div>
        </div>
      </DemoLayout>
      <SavingsVisualizer
        savedPercentage={savedPercentage}
        savedKB={baseSize - estimatedSize}
        imageCount={imageCount}
        originalSizeKB={baseSize}
        optimizedSizeKB={estimatedSize}
      />
    </div>
  );
}

type ImageContainerProps = {
  readonly imageUrl: string;
  readonly label: string;
  readonly imageRef: React.RefObject<HTMLImageElement | null>;
  readonly onMouseMove: (e: React.MouseEvent<HTMLImageElement>) => void;
  readonly onMouseEnter: () => void;
  readonly onMouseLeave: () => void;
};

function ImageContainer({
  imageUrl,
  label,
  imageRef,
  onMouseMove,
  onMouseEnter,
  onMouseLeave,
}: ImageContainerProps) {
  return (
    <div className="relative h-full w-full">
      <img
        ref={imageRef}
        src={imageUrl}
        alt={label}
        className="h-full w-full cursor-crosshair object-contain transition-transform duration-300"
        draggable={false}
        loading="lazy"
        onMouseMove={onMouseMove}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    </div>
  );
}

type ComparisonMagnifierProps = {
  readonly originalImageUrl: string;
  readonly optimizedImageUrl: string;
  readonly imagePos: { x: number; y: number };
  readonly isVisible: boolean;
  readonly zoom?: number;
  readonly height?: number;
};

function ComparisonMagnifier({
  originalImageUrl,
  optimizedImageUrl,
  imagePos,
  isVisible,
  zoom = 5,
  height = 120,
}: ComparisonMagnifierProps) {
  const bgPosition = `${((0.5 - imagePos.x * zoom) / (1 - zoom)) * 100}% ${((0.5 - imagePos.y * zoom) / (1 - zoom)) * 100}%`;

  return (
    <div
      className="pointer-events-none absolute right-0 bottom-0 left-0 z-30 col-span-2 translate-y-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-xl transition-all duration-300 ease-out dark:border-white/10 dark:bg-gray-900"
      style={{
        height: isVisible ? `${height}px` : "0px",
        marginTop: "12px",
        opacity: isVisible ? 1 : 0,
      }}
    >
      {/* Image comparison area */}
      <div className="relative grid h-full grid-cols-2">
        {/* Original side */}
        <div className="relative h-full w-full overflow-hidden">
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `url(${originalImageUrl})`,
              backgroundSize: `${zoom * 100}%`,
              backgroundPosition: bgPosition,
              backgroundRepeat: "no-repeat",
            }}
          />
          {/* Label */}
          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent px-3 pt-6 pb-2">
            <Badge
              variant="secondary"
              className="border-white/20 bg-white/10 text-[10px] text-white/90 backdrop-blur-sm"
            >
              Original
            </Badge>
          </div>
        </div>

        {/* Center divider */}
        <div className="absolute top-0 bottom-0 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center">
          <div className="h-full w-px bg-white shadow-sm" />
          <div className="absolute top-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-gray-900 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg">
            VS
          </div>
        </div>

        {/* Optimized side */}
        <div className="relative h-full w-full overflow-hidden">
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `url(${optimizedImageUrl})`,
              backgroundSize: `${zoom * 100}%`,
              backgroundPosition: bgPosition,
              backgroundRepeat: "no-repeat",
            }}
          />
          {/* Label */}
          <div className="absolute inset-x-0 bottom-0 flex justify-end bg-linear-to-t from-black/50 to-transparent px-3 pt-6 pb-2">
            <Badge
              variant="secondary"
              className="border-white/20 bg-white/10 text-[10px] text-white/90 backdrop-blur-sm"
            >
              Optimized
            </Badge>
          </div>
        </div>
      </div>

      {/* Zoom indicator */}
      <div className="absolute top-2 right-2 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur-sm">
        {zoom}x
      </div>
    </div>
  );
}

type StatCardProps = {
  readonly value: string | number;
  readonly label: string;
  readonly icon: React.ReactNode;
  readonly highlight?: boolean;
};

function StatCard({ value, label, icon, highlight = false }: StatCardProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center gap-1 rounded-lg p-2 transition-colors",
        highlight
          ? "bg-emerald-100 ring-1 ring-emerald-500/30 dark:bg-emerald-500/10 dark:ring-emerald-500/20"
          : "bg-gray-100 dark:bg-white/5",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2",
          highlight
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-muted-foreground",
        )}
      >
        {icon}
        <p
          className={cn(
            "text-muted-foreground text-[9px] tracking-wider uppercase",
            highlight && "text-emerald-600 dark:text-emerald-400",
          )}
        >
          {label}
        </p>
      </div>
      <p
        className={cn(
          "text-foreground font-mono text-lg font-bold",
          highlight && "text-emerald-600 dark:text-emerald-400",
        )}
      >
        {value}
      </p>
    </div>
  );
}

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

function SavingsVisualizer({
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

  // 3G 2Mbps (average speed)
  const timeSaved3G =
    calculateLoadTime(totalOriginalKB, 2) -
    calculateLoadTime(totalOptimizedKB, 2);

  // 4G 10Mbps
  const timeSaved4G =
    calculateLoadTime(totalOriginalKB, 10) -
    calculateLoadTime(totalOptimizedKB, 10);

  // 5G 100Mbps (average speed)
  const timeSaved5G =
    calculateLoadTime(totalOriginalKB, 100) -
    calculateLoadTime(totalOptimizedKB, 100);

  // Detect change direction
  useEffect(() => {
    const prevValue = prevPercentageRef.current;
    const currentValue = savedPercentage;

    if (prevValue !== currentValue) {
      // Savings decrease = cost rising
      const isCostRising = currentValue < prevValue;

      if (isCostRising) {
        setIsRising(true);
        setIsShaking(true);
      } else {
        // When savings increase, immediately switch back to green for smoother transition
        setIsRising(false);
        setIsShaking(false);
      }

      prevPercentageRef.current = currentValue;

      if (shakeTimeoutRef.current) {
        clearTimeout(shakeTimeoutRef.current);
      }

      // Only delay closing shaking and isRising when cost is rising
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

  function handleToggle() {
    setIsExpanded((prev) => !prev);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle();
    }
  }

  const trendColorClass = isRising
    ? "text-red-500 dark:text-red-400"
    : "text-accent dark:text-accent";

  const trendBgClass = isRising
    ? "bg-red-100 dark:bg-red-500/20"
    : "bg-accent/10 dark:bg-accent/20";

  const iconColorClass = isRising ? "text-red-500" : "text-accent";

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/2">
      {/* Collapsible Header */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label="Toggle savings calculator details"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
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

        {/* Summary badge */}
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
              <div className="rounded-lg bg-gray-50 p-2.5 text-center dark:bg-white/5">
                <div className="mb-1 flex items-center justify-center gap-1">
                  <ImageIcon className="text-muted-foreground h-3 w-3" />
                  <span className="text-muted-foreground text-[9px] uppercase">
                    Per Image
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
                    {formatFileSize(savedKB)}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-2.5 text-center dark:bg-white/5">
                <div className="mb-1 flex items-center justify-center gap-1">
                  <HardDrive className="text-muted-foreground h-3 w-3" />
                  <span className="text-muted-foreground text-[9px] uppercase">
                    Saved
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
                    {formatFileSize(totalSavedKB)}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-2.5 text-center dark:bg-white/5">
                <div className="mb-1 flex items-center justify-center gap-1">
                  <Wifi className="text-muted-foreground h-3 w-3" />
                  <span className="text-muted-foreground text-[9px] uppercase">
                    3G Load
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
                    {formatTime(timeSaved3G)}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-2.5 text-center dark:bg-white/5">
                <div className="mb-1 flex items-center justify-center gap-1">
                  <Wifi className="text-muted-foreground h-3 w-3" />
                  <span className="text-muted-foreground text-[9px] uppercase">
                    4G Load
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
                    {formatTime(timeSaved4G)}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-2.5 text-center dark:bg-white/5">
                <div className="mb-1 flex items-center justify-center gap-1">
                  <Wifi className="text-muted-foreground h-3 w-3" />
                  <span className="text-muted-foreground text-[9px] uppercase">
                    5G Load
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
                    {formatTime(timeSaved5G)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
