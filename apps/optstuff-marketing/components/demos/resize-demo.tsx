"use client";

import { SlidingToggleGroup } from "@/components/sliding-toggle-group";
import { CodeBlock } from "@workspace/ui/components/code-block";
import { Label } from "@workspace/ui/components/label";
import { Slider } from "@workspace/ui/components/slider";
import { Maximize2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  DEMO_IMAGE,
  ORIGINAL_HEIGHT,
  ORIGINAL_SIZE_KB,
  ORIGINAL_WIDTH,
} from "./constants";
import { ControlCard, DemoHeader, DemoLayout } from "./layouts";

const FIT_MODES = {
  cover: "cover",
  contain: "contain",
  fill: "fill",
  inside: "contain",
  outside: "cover",
} as const;

type FitMode = keyof typeof FIT_MODES;

const PREVIEW_MAX_WIDTH = 320;
const PREVIEW_ASPECT_RATIO = 4 / 3;

function estimateFileSize(width: number, height: number): number {
  const ratio = (width * height) / (ORIGINAL_WIDTH * ORIGINAL_HEIGHT);
  return Math.round(Math.pow(ratio, 0.85) * ORIGINAL_SIZE_KB);
}

function formatSize(kb: number): string {
  if (kb >= 1000) return `${(kb / 1000).toFixed(1)} MB`;
  return `${kb} KB`;
}

/**
 * Calculates scaled preview size to fit within fixed container
 */
function calculateScaledSize(
  targetWidth: number,
  targetHeight: number,
  containerWidth: number,
  containerHeight: number,
): { readonly width: number; readonly height: number } {
  const scaleX = containerWidth / targetWidth;
  const scaleY = containerHeight / targetHeight;
  const scale = Math.min(scaleX, scaleY, 1); // Scale down only, never up

  return {
    width: Math.round(targetWidth * scale),
    height: Math.round(targetHeight * scale),
  };
}

const FIT_MODE_OPTIONS = [
  { value: "cover" as const, label: "Cover" },
  { value: "contain" as const, label: "Contain" },
  { value: "fill" as const, label: "Fill" },
  { value: "inside" as const, label: "Inside" },
  { value: "outside" as const, label: "Outside" },
] as const;

export function ResizeDemo() {
  const [width, setWidth] = useState(400);
  const [height, setHeight] = useState(300);
  const [fit, setFit] = useState<FitMode>("cover");
  const previewRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({
    width: PREVIEW_MAX_WIDTH,
    height: Math.round(PREVIEW_MAX_WIDTH / PREVIEW_ASPECT_RATIO),
  });

  const handleResize = useCallback(() => {
    if (!previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    setContainerSize({
      width: rect.width,
      height: rect.height,
    });
  }, []);

  useLayoutEffect(() => {
    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (previewRef.current) observer.observe(previewRef.current);
    return () => observer.disconnect();
  }, [handleResize]);

  const estimatedSize = useMemo(
    () => estimateFileSize(width, height),
    [width, height],
  );

  const scaledSize = useMemo(
    () =>
      calculateScaledSize(
        width,
        height,
        containerSize.width,
        containerSize.height,
      ),
    [width, height, containerSize.width, containerSize.height],
  );

  // Build image URL with resize parameters
  const resizedImageUrl = useMemo(() => {
    const fitMode = FIT_MODES[fit];
    const operations = [`s_${width}x${height}`, `fit_${fitMode}`];
    return `/api/optimize/${operations.join(",")}/${DEMO_IMAGE}`;
  }, [width, height, fit]);

  const getObjectFit = (mode: FitMode): string => {
    return FIT_MODES[mode];
  };

  const getContainerStyle = (mode: FitMode): React.CSSProperties => {
    if (mode === "contain" || mode === "inside") {
      return {
        backgroundColor: "rgba(0,0,0,0.3)",
      };
    }

    return {};
  };

  return (
    <div className="space-y-4">
      <DemoHeader
        icon={<Maximize2 className="h-5 w-5" />}
        title="Resize Images"
        description="Dynamically resize to any dimension"
        action={
          <div className="text-right">
            <p className="mb-1 text-xs tracking-wide uppercase">File size</p>
            <p className="font-mono text-sm">
              <span className="text-muted-foreground line-through">
                {formatSize(ORIGINAL_SIZE_KB)}
              </span>
              <span className="text-muted-foreground mx-2">→</span>
              <span className="text-accent font-semibold">
                {formatSize(estimatedSize)}
              </span>
            </p>
          </div>
        }
      />

      <DemoLayout controlsColSpan={2} previewColSpan={2}>
        <div className="w-full space-y-4 lg:col-span-2">
          <ControlCard>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Width</Label>
                <span className="text-muted-foreground font-mono text-sm">
                  {width}px
                </span>
              </div>
              <Slider
                value={[width]}
                onValueChange={(v) => setWidth(v[0] ?? 400)}
                min={100}
                max={800}
                step={10}
                className="**:[[role=slider]]:h-5 **:[[role=slider]]:w-5"
              />
            </div>
          </ControlCard>

          <ControlCard>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Height</Label>
                <span className="text-muted-foreground font-mono text-sm">
                  {height}px
                </span>
              </div>
              <Slider
                value={[height]}
                onValueChange={(v) => setHeight(v[0] ?? 300)}
                min={100}
                max={600}
                step={10}
                className="**:[[role=slider]]:h-5 **:[[role=slider]]:w-5"
              />
            </div>
          </ControlCard>

          <ControlCard>
            <div className="space-y-3">
              <Label className="text-sm">Fit Mode</Label>
              <SlidingToggleGroup
                value={fit}
                onValueChange={setFit}
                options={FIT_MODE_OPTIONS}
                transitionDuration={200}
              />
            </div>
          </ControlCard>

          <ControlCard>
            <Label className="mb-2 text-sm font-medium">API URL</Label>
            <CodeBlock
              content={`/s_${width}x${height},fit_${FIT_MODES[fit]}/image.jpg`}
            />
          </ControlCard>
        </div>

        {/* Responsive preview container */}
        <div className="bg-muted/50 flex min-h-[280px] w-full items-center justify-center rounded-xl p-4 lg:col-span-2">
          <div className="flex w-full flex-col items-center gap-2.5">
            <div
              ref={previewRef}
              className="bg-background/50 flex w-full max-w-[320px] items-center justify-center rounded-lg border border-dashed border-zinc-600"
              style={{ aspectRatio: `${PREVIEW_ASPECT_RATIO}` }}
            >
              {/* Dynamically sized image frame */}
              <div
                className="ring-border relative overflow-hidden rounded-lg ring-1 transition-all duration-300"
                style={{
                  width: scaledSize.width,
                  height: scaledSize.height,
                  ...getContainerStyle(fit),
                }}
              >
                <Image
                  src={resizedImageUrl}
                  alt="Sample resized image"
                  fill
                  unoptimized
                  className="pointer-events-none transition-all duration-300 select-none"
                  style={{
                    objectFit: getObjectFit(
                      fit,
                    ) as React.CSSProperties["objectFit"],
                  }}
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                />
              </div>
            </div>
            <p className="text-muted-foreground text-xs">
              {width} x {height}px
            </p>
          </div>
        </div>
      </DemoLayout>
    </div>
  );
}
