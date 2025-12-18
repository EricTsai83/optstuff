"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/code-block";
import { ORIGINAL_SIZE_KB, QUALITY_DEMO_IMAGE } from "./constants";
import { ImageIcon, Sparkles, TrendingDown } from "lucide-react";

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
      className={`flex flex-1 flex-col items-center gap-1 rounded-lg p-3 transition-colors ${
        highlight
          ? "bg-emerald-100 ring-1 ring-emerald-500/30 dark:bg-emerald-500/10 dark:ring-emerald-500/20"
          : "bg-gray-100 dark:bg-white/5"
      }`}
    >
      <div
        className={`mb-1 ${highlight ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}
      >
        {icon}
      </div>
      <p
        className={`font-mono text-lg font-bold ${
          highlight
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-foreground"
        }`}
      >
        {value}
      </p>
      <p className="text-muted-foreground text-[10px] tracking-wider uppercase">
        {label}
      </p>
    </div>
  );
}

export function QualityDemo() {
  const [quality, setQuality] = useState(80);
  const [isHovering, setIsHovering] = useState(false);
  const [imagePos, setImagePos] = useState({ x: 0.5, y: 0.5 });
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const optimizedImageRef = useRef<HTMLImageElement | null>(null);

  const baseSize = ORIGINAL_SIZE_KB;
  const estimatedSize = Math.round((quality / 100) * baseSize * 0.8);
  const savedPercentage = Math.round((1 - estimatedSize / baseSize) * 100);

  const optimizedImageUrl = useMemo(() => {
    const operations = [`q_${quality}`, "f_webp"];
    return `/api/optimize/${operations.join(",")}${QUALITY_DEMO_IMAGE}`;
  }, [quality]);

  const ipxSyntax = useMemo(() => {
    const operations = [`q_${quality}`];
    // 只顯示 IPX 語法，不暴露實際的 endpoint
    return `/${operations.join(",")}${QUALITY_DEMO_IMAGE}`;
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-violet-500 to-purple-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-xl font-bold tracking-tight">
              Quality Optimization
            </h3>
          </div>
          <p className="text-muted-foreground text-sm">
            Fine-tune compression for the perfect balance between size and
            quality
          </p>
        </div>
        <Badge
          variant="outline"
          className="border-emerald-600/30 bg-emerald-100 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
        >
          <TrendingDown className="mr-1 h-3 w-3" />
          {savedPercentage}% smaller
        </Badge>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Controls */}
        <div className="space-y-6 lg:col-span-2">
          {/* Quality Slider */}
          <div className="rounded-2xl border border-gray-200 bg-linear-to-b from-gray-50 to-white p-5 dark:border-white/10 dark:from-white/5 dark:to-transparent">
            <div className="mb-4 flex items-center justify-between">
              <Label className="text-sm font-medium">Quality Level</Label>
              <div className="rounded-lg bg-gray-100 px-3 py-1 dark:bg-white/10">
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
              className="***:[[role=slider]]:bg-linear-to-b **:[[role=slider]]:border-2 **:[[role=slider]]:border-gray-300 **:[[role=slider]]:from-white **:[[role=slider]]:to-gray-100 **:[[role=slider]]:shadow-lg dark:**:[[role=slider]]:border-white"
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
          </div>

          {/* API URL */}
          <div className="group rounded-2xl border border-gray-200 bg-linear-to-b from-gray-50 to-white p-5 dark:border-white/10 dark:from-white/5 dark:to-transparent">
            <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
              API URL
            </p>
            <CodeBlock code={ipxSyntax} />
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4 lg:col-span-3">
          <div className="relative grid grid-cols-2 gap-3">
            {/* Original */}
            <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-linear-to-b from-gray-50 to-white p-3 shadow-sm dark:border-white/10 dark:from-white/5 dark:to-transparent">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-medium">
                  Original
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  {baseSize} KB
                </Badge>
              </div>
              <div className="relative aspect-4/3 overflow-hidden rounded-xl bg-gray-100 dark:bg-transparent">
                <ImageContainer
                  imageUrl={originalImageUrl}
                  label="Original"
                  imageRef={originalImageRef}
                  onMouseMove={(e) => handleMouseMove(e, originalImageRef)}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                />
              </div>
            </div>

            {/* Optimized */}
            <div className="group relative overflow-hidden rounded-2xl border border-emerald-300 bg-linear-to-b from-emerald-50 to-white p-3 shadow-sm dark:border-emerald-500/20 dark:from-emerald-500/5 dark:to-transparent">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Optimized
                </span>
                <Badge
                  variant="secondary"
                  className="border-emerald-300 bg-emerald-100 text-[10px] text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
                >
                  {estimatedSize} KB
                </Badge>
              </div>
              <div className="relative aspect-4/3 overflow-hidden rounded-xl bg-emerald-50 dark:bg-transparent">
                <ImageContainer
                  imageUrl={optimizedImageUrl}
                  label="Optimized"
                  imageRef={optimizedImageRef}
                  onMouseMove={(e) => handleMouseMove(e, optimizedImageRef)}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                />
              </div>
            </div>

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
          <div className="flex gap-3">
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
      </div>
    </div>
  );
}
