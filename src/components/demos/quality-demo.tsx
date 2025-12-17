"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ORIGINAL_SIZE_KB, DEMO_IMAGE } from "./constants";

export function QualityDemo() {
  const [quality, setQuality] = useState(80);
  const [progressive, setProgressive] = useState(true);

  const baseSize = ORIGINAL_SIZE_KB;
  const estimatedSize = Math.round((quality / 100) * baseSize * 0.8);

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
              /q_{quality}
              {progressive ? ",progressive" : ""}/image.jpg
            </code>
          </div>
        </div>

        <div className="bg-muted/50 flex min-h-[320px] flex-col items-center justify-center rounded-xl p-6">
          <div className="bg-muted ring-border relative mb-4 h-48 w-64 overflow-hidden rounded-lg ring-1">
            <img
              src={DEMO_IMAGE}
              alt="Quality demo"
              className="h-full w-full object-cover"
              style={{
                filter:
                  quality < 50 ? `blur(${(50 - quality) / 25}px)` : "none",
              }}
            />
            <div className="bg-background/90 absolute right-2 bottom-2 rounded-md px-2 py-1 font-mono text-xs backdrop-blur">
              {quality}%
            </div>
          </div>
          <div className="flex gap-6 text-center text-xs">
            <div>
              <p className="text-foreground font-mono font-medium">
                {estimatedSize} KB
              </p>
              <p className="text-muted-foreground">Size</p>
            </div>
            <div>
              <p className="text-foreground font-mono font-medium">
                {quality}%
              </p>
              <p className="text-muted-foreground">Quality</p>
            </div>
            <div>
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
