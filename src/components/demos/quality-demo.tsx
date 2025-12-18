"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ORIGINAL_SIZE_KB, QUALITY_DEMO_IMAGE } from "./constants";

/**
 * Image container component (used to trigger comparison magnifier)
 */
function ImageContainer({
  imageUrl,
  label,
  imageRef,
  onMouseMove,
  onMouseEnter,
  onMouseLeave,
}: {
  readonly imageUrl: string;
  readonly label: string;
  readonly imageRef: React.RefObject<HTMLImageElement | null>;
  readonly onMouseMove: (e: React.MouseEvent<HTMLImageElement>) => void;
  readonly onMouseEnter: () => void;
  readonly onMouseLeave: () => void;
}) {
  return (
    <div className="relative h-full w-full">
      <img
        ref={imageRef}
        src={imageUrl}
        alt={label}
        className="h-full w-full cursor-crosshair object-contain"
        draggable={false}
        loading="lazy"
        onMouseMove={onMouseMove}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    </div>
  );
}

/**
 * Comparison magnifier component
 * Displays a magnified comparison of the same area from both images in a horizontal bar shape floating below the images
 */
function ComparisonMagnifier({
  originalImageUrl,
  optimizedImageUrl,
  imagePos,
  isVisible,
  zoom = 5,
  height = 80,
}: {
  readonly originalImageUrl: string;
  readonly optimizedImageUrl: string;
  readonly imagePos: { x: number; y: number };
  readonly isVisible: boolean;
  readonly zoom?: number;
  readonly height?: number;
}) {
  if (!isVisible) return null;

  return (
    <div
      className="border-border/50 bg-background/95 pointer-events-none absolute right-0 bottom-10 left-0 z-30 translate-y-full overflow-hidden rounded-lg border-2 shadow-[0_8px_32px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.1)_inset] backdrop-blur-md transition-all duration-200 ease-out"
      style={{
        height: `${height}px`,
        marginTop: "16px",
      }}
    >
      {/* Side-by-side comparison of both images */}
      <div className="grid h-full grid-cols-2">
        {/* Original image */}
        <div
          className="h-full w-full overflow-hidden"
          style={{
            backgroundImage: `url(${originalImageUrl})`,
            backgroundSize: `${zoom * 100}%`,
            backgroundPosition: `${((0.5 - imagePos.x * zoom) / (1 - zoom)) * 100}% ${((0.5 - imagePos.y * zoom) / (1 - zoom)) * 100}%`,
            backgroundRepeat: "no-repeat",
          }}
        />
        {/* Optimized image */}
        <div
          className="border-border h-full w-full overflow-hidden border-l-2"
          style={{
            backgroundImage: `url(${optimizedImageUrl})`,
            backgroundSize: `${zoom * 100}%`,
            backgroundPosition: `${((0.5 - imagePos.x * zoom) / (1 - zoom)) * 100}% ${((0.5 - imagePos.y * zoom) / (1 - zoom)) * 100}%`,
            backgroundRepeat: "no-repeat",
          }}
        />
      </div>
      {/* Labels - placed at bottom to avoid blocking images */}
      <Badge
        variant="secondary"
        className="pointer-events-none absolute bottom-2 left-2"
      >
        Original
      </Badge>
      <Badge
        variant="secondary"
        className="pointer-events-none absolute right-2 bottom-2"
      >
        Optimized
      </Badge>
      {/* Divider label - placed at bottom center */}
      <Badge
        variant="default"
        className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-xs"
      >
        vs
      </Badge>
    </div>
  );
}

export function QualityDemo() {
  const [quality, setQuality] = useState(80);
  const [progressive, setProgressive] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [imagePos, setImagePos] = useState({ x: 0.5, y: 0.5 });
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const optimizedImageRef = useRef<HTMLImageElement | null>(null);

  const baseSize = ORIGINAL_SIZE_KB;
  const estimatedSize = Math.round((quality / 100) * baseSize * 0.8);

  // Build optimized image URL: convert PNG to WebP and apply quality parameter
  // Use larger size to see quality differences more clearly
  const optimizedImageUrl = useMemo(() => {
    const operations = [`q_${quality}`, "f_webp", "w_800"];
    if (progressive) {
      operations.push("progressive");
    }
    return `/api/optimize/${operations.join(",")}${QUALITY_DEMO_IMAGE}`;
  }, [quality, progressive]);

  // Original image URL (using highest quality for comparison)
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

      // If image hasn't loaded yet, use container dimensions
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

      // Calculate aspect ratios of container and image
      const containerAspect = imgRect.width / imgRect.height;
      const imageAspect = naturalWidth / naturalHeight;

      // Calculate actual displayed image dimensions (considering object-contain scaling)
      let displayedWidth: number;
      let displayedHeight: number;
      let offsetX: number;
      let offsetY: number;

      if (imageAspect > containerAspect) {
        // Image is wider, fit to width
        displayedWidth = imgRect.width;
        displayedHeight = imgRect.width / imageAspect;
        offsetX = 0;
        offsetY = (imgRect.height - displayedHeight) / 2;
      } else {
        // Image is taller, fit to height
        displayedWidth = imgRect.height * imageAspect;
        displayedHeight = imgRect.height;
        offsetX = (imgRect.width - displayedWidth) / 2;
        offsetY = 0;
      }

      // Calculate mouse position relative to actual image display area (0-1)
      const mouseX = e.clientX - imgRect.left;
      const mouseY = e.clientY - imgRect.top;

      // Check if mouse is within the actual image display area
      if (
        mouseX < offsetX ||
        mouseX > offsetX + displayedWidth ||
        mouseY < offsetY ||
        mouseY > offsetY + displayedHeight
      ) {
        // Mouse is in blank area, hide magnifier
        setIsHovering(false);
        return;
      }

      // Mouse is within actual image display area, show magnifier and update position
      setIsHovering(true);

      const imgX = (mouseX - offsetX) / displayedWidth;
      const imgY = (mouseY - offsetY) / displayedHeight;

      // Clamp within image bounds
      const clampedX = Math.max(0, Math.min(1, imgX));
      const clampedY = Math.max(0, Math.min(1, imgY));

      setImagePos({ x: clampedX, y: clampedY });
    },
    [],
  );

  const handleMouseEnter = useCallback(() => {
    // Don't immediately set to true, let handleMouseMove determine if within image area
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    setImagePos({ x: 0.5, y: 0.5 });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Quality Optimization</h3>
          <p className="text-muted-foreground text-sm">
            Fine-tune compression for the perfect balance
          </p>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground mb-1 text-xs tracking-wide uppercase">
            Estimated
          </p>
          <p className="text-accent font-mono text-sm font-semibold">
            {estimatedSize} KB
          </p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Quality</Label>
              <span className="text-muted-foreground font-mono text-sm">
                {quality}%
              </span>
            </div>
            <Slider
              value={[quality]}
              onValueChange={(v) => setQuality(v[0] ?? 80)}
              min={10}
              max={100}
              step={5}
              className="**:[[role=slider]]:h-4 **:[[role=slider]]:w-4"
            />
            <div className="text-muted-foreground flex justify-between text-xs">
              <span>Smaller file</span>
              <span>Higher quality</span>
            </div>
          </div>

          <div className="bg-muted/50 flex items-center justify-between rounded-xl p-4">
            <div>
              <Label htmlFor="progressive" className="text-sm font-medium">
                Progressive Loading
              </Label>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Better perceived performance
              </p>
            </div>
            <Switch
              id="progressive"
              checked={progressive}
              onCheckedChange={setProgressive}
            />
          </div>

          <div className="rounded-xl bg-[#18181b] p-4">
            <p className="mb-2 text-xs text-[#71717a]">API URL</p>
            <code className="font-mono text-sm break-all text-[#a1a1aa]">
              {optimizedImageUrl}
            </code>
          </div>
        </div>

        <div className="space-y-3">
          {/* Side-by-side comparison */}
          <div className="relative grid grid-cols-2 gap-4">
            <div className="bg-muted/50 flex flex-col items-center justify-center rounded-xl p-4">
              <p className="text-muted-foreground mb-2 text-xs">Original</p>
              <div className="bg-muted ring-border relative h-56 w-full overflow-hidden rounded-lg ring-1">
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
            <div className="bg-muted/50 flex flex-col items-center justify-center rounded-xl p-4">
              <p className="text-muted-foreground mb-2 text-xs">
                Quality {quality}%
              </p>
              <div className="bg-muted ring-border relative h-56 w-full overflow-hidden rounded-lg ring-1">
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

            {/* Unified comparison magnifier (horizontal bar, floating below images) */}
            <ComparisonMagnifier
              originalImageUrl={originalImageUrl}
              optimizedImageUrl={optimizedImageUrl}
              imagePos={imagePos}
              isVisible={isHovering}
              zoom={5}
              height={80}
            />
          </div>

          {/* Statistics */}
          <div className="bg-muted/50 flex gap-6 rounded-xl p-4 text-center text-xs">
            <div className="flex-1">
              <p className="text-foreground font-mono font-medium">
                {estimatedSize} KB
              </p>
              <p className="text-muted-foreground">Size</p>
            </div>
            <div className="flex-1">
              <p className="text-foreground font-mono font-medium">
                {quality}%
              </p>
              <p className="text-muted-foreground">Quality</p>
            </div>
            <div className="flex-1">
              <p className="text-accent font-mono font-medium">
                {Math.round((1 - estimatedSize / baseSize) * 100)}%
              </p>
              <p className="text-muted-foreground">Saved</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
