"use client";

import { useState, useMemo } from "react";
import { Slider } from "@workspace/ui/components/slider";
import { Label } from "@workspace/ui/components/label";
import { SlidingToggleGroup } from "@/components/sliding-toggle-group";
import { CodeBlock } from "@/components/code-block";
import { Maximize2 } from "lucide-react";
import {
  ORIGINAL_WIDTH,
  ORIGINAL_HEIGHT,
  ORIGINAL_SIZE_KB,
  DEMO_IMAGE,
} from "./constants.js";
import {
  DemoHeader,
  DemoLayout,
  ControlCard,
  ImagePreview,
} from "./layouts/index.js";

const FIT_MODES = {
  cover: "cover",
  contain: "contain",
  fill: "fill",
  inside: "contain",
  outside: "cover",
} as const;

type FitMode = keyof typeof FIT_MODES;

function estimateFileSize(width: number, height: number): number {
  const ratio = (width * height) / (ORIGINAL_WIDTH * ORIGINAL_HEIGHT);
  return Math.round(Math.pow(ratio, 0.85) * ORIGINAL_SIZE_KB);
}

function formatSize(kb: number): string {
  if (kb >= 1000) return `${(kb / 1000).toFixed(1)} MB`;
  return `${kb} KB`;
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

  const estimatedSize = useMemo(
    () => estimateFileSize(width, height),
    [width, height],
  );

  // Calculate aspect ratio from width and height
  const aspectRatio = useMemo(() => width / height, [width, height]);

  // Build image URL with resize parameters
  const resizedImageUrl = useMemo(() => {
    const operations = [`s_${width}x${height}`, `fit_${fit}`];
    return `/api/optimize/${operations.join(",")}${DEMO_IMAGE}`;
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
                className="**:[[role=slider]]:h-4 **:[[role=slider]]:w-4"
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
                className="**:[[role=slider]]:h-4 **:[[role=slider]]:w-4"
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
            <CodeBlock code={`/s_${width}x${height},fit_${fit}/image.jpg`} />
          </ControlCard>
        </div>

        <ImagePreview
          imageUrl={resizedImageUrl}
          imageAlt="Sample resized image"
          imageContainerClassName="pointer-events-none select-none"
          imageContainerStyle={getContainerStyle(fit)}
          imageStyle={{
            objectFit: getObjectFit(fit) as React.CSSProperties["objectFit"],
          }}
          aspectRatio={aspectRatio}
          footer={
            <p className="text-muted-foreground text-xs">
              {width} x {height}px
            </p>
          }
        />
      </DemoLayout>
    </div>
  );
}
