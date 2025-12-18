"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ORIGINAL_SIZE_KB, QUALITY_DEMO_IMAGE } from "./constants";

/**
 * 圖片容器組件（用於觸發對比放大鏡）
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
  readonly onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  readonly onMouseEnter: () => void;
  readonly onMouseLeave: () => void;
}) {
  return (
    <div
      className="relative h-full w-full cursor-crosshair"
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <img
        ref={imageRef}
        src={imageUrl}
        alt={label}
        className="h-full w-full object-contain"
        draggable={false}
        loading="lazy"
      />
    </div>
  );
}

/**
 * 對比放大鏡組件
 * 以長條型形狀浮在圖片正下方顯示兩張圖片相同區域的放大對比
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
      {/* 並排對比兩張圖片 */}
      <div className="grid h-full grid-cols-2">
        {/* 原圖 */}
        <div
          className="h-full w-full overflow-hidden"
          style={{
            backgroundImage: `url(${originalImageUrl})`,
            backgroundSize: `${zoom * 100}%`,
            backgroundPosition: `${((0.5 - imagePos.x * zoom) / (1 - zoom)) * 100}% ${((0.5 - imagePos.y * zoom) / (1 - zoom)) * 100}%`,
            backgroundRepeat: "no-repeat",
          }}
        />
        {/* 優化後的圖片 */}
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
      {/* 標籤 - 放在底部避免遮擋圖片 */}
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
      {/* 分隔線標籤 - 放在底部中間 */}
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

  // 構建優化後的圖片 URL：將 PNG 轉換為 WebP 並應用 quality 參數
  // 使用較大的尺寸以便更清楚地看到畫質差異
  const optimizedImageUrl = useMemo(() => {
    const operations = [`q_${quality}`, "f_webp", "w_800"];
    if (progressive) {
      operations.push("progressive");
    }
    return `/api/optimize/${operations.join(",")}${QUALITY_DEMO_IMAGE}`;
  }, [quality, progressive]);

  // 原圖 URL（使用最高質量以便對比）
  const originalImageUrl = useMemo(() => {
    return `/api/optimize/q_100,f_webp,w_800${QUALITY_DEMO_IMAGE}`;
  }, []);

  const handleMouseMove = useCallback(
    (
      e: React.MouseEvent<HTMLDivElement>,
      imageRef: React.RefObject<HTMLImageElement | null>,
    ) => {
      if (!imageRef.current) return;

      const img = imageRef.current;
      const imgRect = img.getBoundingClientRect();
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;

      // 如果圖片還沒載入完成，使用容器尺寸
      if (naturalWidth === 0 || naturalHeight === 0) {
        const imgX = (e.clientX - imgRect.left) / imgRect.width;
        const imgY = (e.clientY - imgRect.top) / imgRect.height;
        setImagePos({
          x: Math.max(0, Math.min(1, imgX)),
          y: Math.max(0, Math.min(1, imgY)),
        });
        return;
      }

      // 計算容器和圖片的寬高比
      const containerAspect = imgRect.width / imgRect.height;
      const imageAspect = naturalWidth / naturalHeight;

      // 計算實際顯示的圖片尺寸（考慮 object-contain 縮放）
      let displayedWidth: number;
      let displayedHeight: number;
      let offsetX: number;
      let offsetY: number;

      if (imageAspect > containerAspect) {
        // 圖片較寬，以寬度為準
        displayedWidth = imgRect.width;
        displayedHeight = imgRect.width / imageAspect;
        offsetX = 0;
        offsetY = (imgRect.height - displayedHeight) / 2;
      } else {
        // 圖片較高，以高度為準
        displayedWidth = imgRect.height * imageAspect;
        displayedHeight = imgRect.height;
        offsetX = (imgRect.width - displayedWidth) / 2;
        offsetY = 0;
      }

      // 計算滑鼠在實際圖片顯示區域上的相對位置 (0-1)
      const mouseX = e.clientX - imgRect.left;
      const mouseY = e.clientY - imgRect.top;

      const imgX = (mouseX - offsetX) / displayedWidth;
      const imgY = (mouseY - offsetY) / displayedHeight;

      // 限制在圖片範圍內
      const clampedX = Math.max(0, Math.min(1, imgX));
      const clampedY = Math.max(0, Math.min(1, imgY));

      setImagePos({ x: clampedX, y: clampedY });
    },
    [],
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
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
          {/* 並排對比 */}
          <div className="relative grid grid-cols-2 gap-4">
            <div className="bg-muted/50 flex flex-col items-center justify-center rounded-xl p-4">
              <p className="text-muted-foreground mb-2 text-xs">Original</p>
              <div className="bg-muted ring-border relative h-64 w-full overflow-hidden rounded-lg ring-1">
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
              <div className="bg-muted ring-border relative h-64 w-full overflow-hidden rounded-lg ring-1">
                <ImageContainer
                  imageUrl={optimizedImageUrl}
                  label="Optimized"
                  imageRef={optimizedImageRef}
                  onMouseMove={(e) => handleMouseMove(e, optimizedImageRef)}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                />
                <div className="bg-background/90 absolute top-2 right-2 z-20 rounded-md px-2 py-1 font-mono text-xs backdrop-blur">
                  {quality}%
                </div>
              </div>
            </div>

            {/* 統一的對比放大鏡（長條型，浮在圖片正下方） */}
            <ComparisonMagnifier
              originalImageUrl={originalImageUrl}
              optimizedImageUrl={optimizedImageUrl}
              imagePos={imagePos}
              isVisible={isHovering}
              zoom={5}
              height={80}
            />
          </div>

          {/* 統計資訊 */}
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
