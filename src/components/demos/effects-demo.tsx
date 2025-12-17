"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEMO_IMAGE } from "./constants";

export function EffectsDemo() {
  const [blur, setBlur] = useState(0);
  const [sharpen, setSharpen] = useState(0);
  const [grayscale, setGrayscale] = useState(false);
  const [rotate, setRotate] = useState(0);
  const [flip, setFlip] = useState(false);

  const reset = () => {
    setBlur(0);
    setSharpen(0);
    setGrayscale(false);
    setRotate(0);
    setFlip(false);
  };

  const buildUrl = () => {
    const modifiers = [];
    if (blur > 0) modifiers.push(`blur_${blur}`);
    if (sharpen > 0) modifiers.push(`sharpen_${sharpen}`);
    if (grayscale) modifiers.push("grayscale");
    if (rotate > 0) modifiers.push(`rotate_${rotate}`);
    if (flip) modifiers.push("flip");
    return modifiers.length > 0
      ? `/${modifiers.join(",")}/image.jpg`
      : "/image.jpg";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Image Effects</h3>
          <p className="text-muted-foreground text-sm">
            Apply transformations and filters on-the-fly
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={reset}
          className="text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Blur</Label>
              <span className="text-muted-foreground font-mono text-sm">
                {blur}
              </span>
            </div>
            <Slider
              value={[blur]}
              onValueChange={(v) => setBlur(v[0] ?? 0)}
              min={0}
              max={20}
              step={1}
              className="**:[[role=slider]]:h-4 **:[[role=slider]]:w-4"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Sharpen</Label>
              <span className="text-muted-foreground font-mono text-sm">
                {sharpen}
              </span>
            </div>
            <Slider
              value={[sharpen]}
              onValueChange={(v) => setSharpen(v[0] ?? 0)}
              min={0}
              max={10}
              step={1}
              className="**:[[role=slider]]:h-4 **:[[role=slider]]:w-4"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Rotate</Label>
              <span className="text-muted-foreground font-mono text-sm">
                {rotate}°
              </span>
            </div>
            <Slider
              value={[rotate]}
              onValueChange={(v) => setRotate(v[0] ?? 0)}
              min={0}
              max={360}
              step={90}
              className="**:[[role=slider]]:h-4 **:[[role=slider]]:w-4"
            />
          </div>

          <div className="flex gap-3">
            <div className="bg-muted/50 flex flex-1 items-center gap-3 rounded-xl p-3">
              <Switch
                id="grayscale"
                checked={grayscale}
                onCheckedChange={setGrayscale}
              />
              <Label htmlFor="grayscale" className="cursor-pointer text-sm">
                Grayscale
              </Label>
            </div>
            <div className="bg-muted/50 flex flex-1 items-center gap-3 rounded-xl p-3">
              <Switch id="flip" checked={flip} onCheckedChange={setFlip} />
              <Label htmlFor="flip" className="cursor-pointer text-sm">
                Flip
              </Label>
            </div>
          </div>

          <div className="rounded-xl bg-[#18181b] p-4">
            <p className="mb-2 text-xs text-[#71717a]">API URL</p>
            <code className="font-mono text-sm break-all text-[#a1a1aa]">
              {buildUrl()}
            </code>
          </div>
        </div>

        <div className="bg-muted/50 flex min-h-[320px] items-center justify-center rounded-xl p-6">
          <div
            className="bg-muted ring-border h-40 w-56 overflow-hidden rounded-lg ring-1 transition-all duration-300"
            style={{
              transform: `rotate(${rotate}deg) ${flip ? "scaleX(-1)" : ""}`,
              filter: `blur(${blur}px) ${grayscale ? "grayscale(100%)" : ""} ${sharpen > 0 ? `contrast(${1 + sharpen * 0.1})` : ""}`,
            }}
          >
            <img
              src={DEMO_IMAGE}
              alt="Effects demo"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
