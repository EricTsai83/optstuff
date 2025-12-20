"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RotateCcw, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/code-block";
import { DEMO_IMAGE } from "./constants";
import { DemoHeader, DemoLayout, ControlCard, ImagePreview } from "./layouts";

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
    <div className="space-y-4">
      <DemoHeader
        icon={<Wand2 className="h-5 w-5" />}
        title="Image Effects"
        description="Apply transformations and filters on-the-fly"
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            className="text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        }
      />

      <DemoLayout controlsColSpan={2} previewColSpan={2}>
        <div className="space-y-4 lg:col-span-2">
          <ControlCard>
            <div className="space-y-2.5">
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
          </ControlCard>

          <ControlCard>
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
          </ControlCard>

          <ControlCard>
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
          </ControlCard>

          <ControlCard>
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
          </ControlCard>

          <ControlCard>
            <Label className="mb-2 text-sm font-medium">API URL</Label>
            <CodeBlock code={buildUrl()} />
          </ControlCard>
        </div>

        <ImagePreview
          imageUrl={DEMO_IMAGE}
          imageAlt="Effects demo"
          imageContainerClassName="bg-muted"
          aspectRatio={4 / 3}
          imageContainerStyle={{
            transform: `rotate(${rotate}deg) ${flip ? "scaleX(-1)" : ""}`,
            filter: `blur(${blur}px) ${grayscale ? "grayscale(100%)" : ""} ${sharpen > 0 ? `contrast(${1 + sharpen * 0.1})` : ""}`,
          }}
          imageStyle={{ objectFit: "cover" }}
        />
      </DemoLayout>
    </div>
  );
}
