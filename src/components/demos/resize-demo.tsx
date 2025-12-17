"use client";

import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FIT_MODES = {
  cover: "cover",
  contain: "contain",
  fill: "fill",
  inside: "contain",
  outside: "cover",
} as const;

type FitMode = keyof typeof FIT_MODES;

const IMAGE_URL = "/demo-image-dark.jpeg";
const ORIGINAL_WIDTH = 800;
const ORIGINAL_HEIGHT = 600;
const ORIGINAL_SIZE_KB = 240;
const PREVIEW_MAX_WIDTH = 320;
const PREVIEW_MAX_HEIGHT = 240;

function estimateFileSize(width: number, height: number): number {
  const ratio = (width * height) / (ORIGINAL_WIDTH * ORIGINAL_HEIGHT);
  return Math.round(Math.pow(ratio, 0.85) * ORIGINAL_SIZE_KB);
}

function formatSize(kb: number): string {
  if (kb >= 1000) return `${(kb / 1000).toFixed(1)} MB`;
  return `${kb} KB`;
}

export function ResizeDemo() {
  const [width, setWidth] = useState(400);
  const [height, setHeight] = useState(300);
  const [fit, setFit] = useState<FitMode>("cover");

  const estimatedSize = useMemo(
    () => estimateFileSize(width, height),
    [width, height],
  );

  const previewDimensions = useMemo(() => {
    const aspectRatio = width / height;
    let previewWidth: number;
    let previewHeight: number;

    if (aspectRatio > PREVIEW_MAX_WIDTH / PREVIEW_MAX_HEIGHT) {
      previewWidth = PREVIEW_MAX_WIDTH;
      previewHeight = PREVIEW_MAX_WIDTH / aspectRatio;
    } else {
      previewHeight = PREVIEW_MAX_HEIGHT;
      previewWidth = PREVIEW_MAX_HEIGHT * aspectRatio;
    }

    return { width: previewWidth, height: previewHeight };
  }, [width, height]);

  const getObjectFit = (mode: FitMode): string => {
    return FIT_MODES[mode];
  };

  const getContainerStyle = (mode: FitMode): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      width: previewDimensions.width,
      height: previewDimensions.height,
    };

    if (mode === "contain" || mode === "inside") {
      return {
        ...baseStyle,
        backgroundColor: "rgba(0,0,0,0.3)",
      };
    }

    return baseStyle;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Resize Images</h3>
          <p className="text-muted-foreground text-sm">
            Dynamically resize to any dimension
          </p>
        </div>
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
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <div className="space-y-3">
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
              className="**:[[role=slider]]:h-4 **:[[role=slider]]:w-4"
            />
          </div>

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
              className="**:[[role=slider]]:h-4 **:[[role=slider]]:w-4"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm">Fit Mode</Label>
            <Select value={fit} onValueChange={(v) => setFit(v as FitMode)}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cover">Cover</SelectItem>
                <SelectItem value="contain">Contain</SelectItem>
                <SelectItem value="fill">Fill</SelectItem>
                <SelectItem value="inside">Inside</SelectItem>
                <SelectItem value="outside">Outside</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl bg-[#18181b] p-4">
            <p className="mb-2 text-xs text-[#71717a]">API URL</p>
            <code className="font-mono text-sm break-all text-[#a1a1aa]">
              /s_{width}x{height},fit_{fit}/image.jpg
            </code>
          </div>
        </div>

        <div className="bg-muted/50 flex min-h-[320px] items-center justify-center rounded-xl p-6">
          <div className="flex flex-col items-center gap-3">
            <div
              className="ring-border overflow-hidden rounded-lg ring-1 transition-all duration-300"
              style={getContainerStyle(fit)}
            >
              <img
                src={IMAGE_URL}
                alt="Sample resized image"
                className="pointer-events-none h-full w-full transition-all duration-300 select-none"
                style={{
                  objectFit: getObjectFit(
                    fit,
                  ) as React.CSSProperties["objectFit"],
                }}
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>
            <p className="text-muted-foreground text-xs">
              {width} x {height}px
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
