"use client";

import { CodeBlock } from "@workspace/ui/components/code-block";
import { Label } from "@workspace/ui/components/label";
import { Slider } from "@workspace/ui/components/slider";
import { ImageIcon, Sparkles, TrendingDown } from "lucide-react";
import Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";
import { ORIGINAL_SIZE_KB, QUALITY_DEMO_IMAGE } from "../constants";
import { ControlCard, DemoHeader, DemoLayout, PreviewCard } from "../layouts";
import { ComparisonMagnifier } from "./comparison-magnifier";
import { SavingsVisualizer } from "./savings-visualizer";
import { StatCard } from "./stat-card";

export function QualityDemo() {
  const [quality, setQuality] = useState(80);
  const [imageCount, setImageCount] = useState(100);
  const [isHovering, setIsHovering] = useState(false);
  const [imagePos, setImagePos] = useState({ x: 0.5, y: 0.5 });
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const optimizedImageRef = useRef<HTMLImageElement | null>(null);

  const baseSize = ORIGINAL_SIZE_KB;
  const estimatedSize =
    quality === 100 ? baseSize : Math.round((quality / 100) * baseSize * 0.8);
  const savedPercentage = Math.round((1 - estimatedSize / baseSize) * 100);

  const optimizedImageUrl = useMemo(() => {
    return `/api/optimize/q_${quality},f_webp,w_800/${QUALITY_DEMO_IMAGE}`;
  }, [quality]);

  const ipxSyntax = useMemo(() => `/q_${quality}/image.webp`, [quality]);

  const originalImageUrl = useMemo(
    () => `/api/optimize/q_100,f_webp,w_800/${QUALITY_DEMO_IMAGE}`,
    [],
  );

  const updatePositionFromClient = useCallback(
    (
      clientX: number,
      clientY: number,
      imageRef: React.RefObject<HTMLImageElement | null>,
    ) => {
      if (!imageRef.current) return;

      const img = imageRef.current;
      const imgRect = img.getBoundingClientRect();
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;

      if (naturalWidth === 0 || naturalHeight === 0) {
        const imgX = (clientX - imgRect.left) / imgRect.width;
        const imgY = (clientY - imgRect.top) / imgRect.height;
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

      const pointerX = clientX - imgRect.left;
      const pointerY = clientY - imgRect.top;

      if (
        pointerX < offsetX ||
        pointerX > offsetX + displayedWidth ||
        pointerY < offsetY ||
        pointerY > offsetY + displayedHeight
      ) {
        setIsHovering(false);
        return;
      }

      setIsHovering(true);
      setImagePos({
        x: Math.max(0, Math.min(1, (pointerX - offsetX) / displayedWidth)),
        y: Math.max(0, Math.min(1, (pointerY - offsetY) / displayedHeight)),
      });
    },
    [],
  );

  const handleMouseMove = useCallback(
    (
      e: React.MouseEvent<HTMLImageElement>,
      imageRef: React.RefObject<HTMLImageElement | null>,
    ) => {
      updatePositionFromClient(e.clientX, e.clientY, imageRef);
    },
    [updatePositionFromClient],
  );

  const handleTouchMove = useCallback(
    (
      e: React.TouchEvent<HTMLDivElement>,
      imageRef: React.RefObject<HTMLImageElement | null>,
    ) => {
      const touch = e.touches[0];
      if (!touch) return;
      e.preventDefault();
      updatePositionFromClient(touch.clientX, touch.clientY, imageRef);
    },
    [updatePositionFromClient],
  );

  const handlePointerLeave = useCallback(() => {
    setIsHovering(false);
    setImagePos({ x: 0.5, y: 0.5 });
  }, []);

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
              onValueChange={(v) => setQuality(v[0] ?? 80)}
              min={10}
              max={100}
              step={5}
              className="**:[[role=slider]]:h-5 **:[[role=slider]]:w-5 **:[[role=slider]]:border-2 **:[[role=slider]]:border-gray-300 **:[[role=slider]]:bg-linear-to-b **:[[role=slider]]:from-white **:[[role=slider]]:to-gray-100 **:[[role=slider]]:shadow-lg dark:**:[[role=slider]]:border-white"
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
              onValueChange={(v) => setImageCount(v[0] ?? 100)}
              min={1}
              max={10000}
              step={1}
              className="**:[[role=slider]]:h-5 **:[[role=slider]]:w-5 **:[[role=slider]]:border-2 **:[[role=slider]]:border-gray-300 **:[[role=slider]]:bg-linear-to-b **:[[role=slider]]:from-white **:[[role=slider]]:to-gray-100 **:[[role=slider]]:shadow-lg dark:**:[[role=slider]]:border-white"
            />
            <div className="text-muted-foreground mt-3 flex justify-between text-xs">
              <span>1 image</span>
              <span>10,000 images</span>
            </div>
          </ControlCard>

          <ControlCard>
            <Label className="mb-2 text-sm font-medium">API URL</Label>
            <CodeBlock content={ipxSyntax} />
          </ControlCard>
        </div>

        {/* Preview */}
        <div className="space-y-3 lg:col-span-3">
          <div className="relative grid grid-cols-2 gap-2.5">
            <PreviewCard label="Original" badge={`${baseSize} KB`}>
              <ImageContainer
                imageUrl={originalImageUrl}
                label="Original"
                imageRef={originalImageRef}
                onMouseMove={(e) => handleMouseMove(e, originalImageRef)}
                onMouseLeave={handlePointerLeave}
                onTouchMove={(e) => handleTouchMove(e, originalImageRef)}
                onTouchEnd={handlePointerLeave}
              />
            </PreviewCard>

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
                onMouseLeave={handlePointerLeave}
                onTouchMove={(e) => handleTouchMove(e, optimizedImageRef)}
                onTouchEnd={handlePointerLeave}
              />
            </PreviewCard>

            <ComparisonMagnifier
              originalImageUrl={originalImageUrl}
              optimizedImageUrl={optimizedImageUrl}
              imagePos={imagePos}
              isVisible={isHovering}
              zoom={5}
              height={100}
            />
          </div>

          <p className="text-muted-foreground text-center text-xs">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            <span className="hidden sm:inline">Hover over images to compare details</span>
            <span className="sm:hidden">Touch and drag to compare details</span>
          </p>

          <div className="grid grid-cols-3 gap-2.5">
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
  readonly onMouseLeave: () => void;
  readonly onTouchMove: (e: React.TouchEvent<HTMLDivElement>) => void;
  readonly onTouchEnd: () => void;
};

function ImageContainer({
  imageUrl,
  label,
  imageRef,
  onMouseMove,
  onMouseLeave,
  onTouchMove,
  onTouchEnd,
}: ImageContainerProps) {
  return (
    <div
      className="relative h-full w-full touch-none"
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <Image
        ref={imageRef}
        src={imageUrl}
        alt={label}
        fill
        unoptimized
        className="h-full w-full cursor-crosshair object-contain transition-transform duration-300"
        draggable={false}
        loading="lazy"
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      />
    </div>
  );
}
