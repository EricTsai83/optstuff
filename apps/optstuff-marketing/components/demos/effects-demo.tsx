"use client";

import { useState } from "react";
import { Slider } from "@workspace/ui/components/slider";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import { RotateCcw, Wand2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { CodeBlock } from "@/components/code-block";
import { DEMO_IMAGE } from "./constants";
import { DemoHeader, DemoLayout, ControlCard, ImagePreview } from "./layouts";
import { cn } from "@workspace/ui/lib/utils";

type SliderControlProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  unit?: string;
  disabled?: boolean;
};

function SliderControl({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit = "",
  disabled = false,
}: SliderControlProps) {
  return (
    <div className={cn("space-y-1.5", disabled && "opacity-50")}>
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <span className="text-muted-foreground font-mono text-xs">
          {value}
          {unit}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(v) => onChange(v[0] ?? min)}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="**:[[role=slider]]:h-3 **:[[role=slider]]:w-3"
      />
    </div>
  );
}

type ToggleControlProps = {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

function ToggleControl({
  id,
  label,
  checked,
  onChange,
  disabled = false,
}: ToggleControlProps) {
  return (
    <div className={cn("flex items-center gap-2", disabled && "opacity-50")}>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
      />
      <Label
        htmlFor={id}
        className={cn(
          "cursor-pointer text-xs",
          disabled && "cursor-not-allowed",
        )}
      >
        {label}
      </Label>
    </div>
  );
}

type SectionHeaderProps = {
  title: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
};

function SectionHeader({ title, enabled, onToggle }: SectionHeaderProps) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h4 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {title}
      </h4>
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground text-xs">
          {enabled ? "On" : "Off"}
        </span>
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          className="scale-75"
        />
      </div>
    </div>
  );
}

export function EffectsDemo() {
  // Section toggles
  const [transformEnabled, setTransformEnabled] = useState(true);
  const [colorEnabled, setColorEnabled] = useState(true);

  // Transform controls
  const [blur, setBlur] = useState(0);
  const [sharpen, setSharpen] = useState(0);
  const [rotate, setRotate] = useState(0);
  const [sepia, setSepia] = useState(0);

  // Color controls
  const [brightness, setBrightness] = useState(100);
  const [saturate, setSaturate] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [hueRotate, setHueRotate] = useState(0);

  // Toggle options
  const [grayscale, setGrayscale] = useState(false);
  const [invert, setInvert] = useState(false);
  const [flip, setFlip] = useState(false);
  const [flop, setFlop] = useState(false);

  function reset() {
    setTransformEnabled(true);
    setColorEnabled(true);
    setBlur(0);
    setSharpen(0);
    setGrayscale(false);
    setRotate(0);
    setFlip(false);
    setFlop(false);
    setBrightness(100);
    setSaturate(100);
    setContrast(100);
    setHueRotate(0);
    setInvert(false);
    setSepia(0);
  }

  function buildUrl() {
    const modifiers: string[] = [];

    // Transform modifiers (only if enabled)
    if (transformEnabled) {
      if (blur > 0) modifiers.push(`blur_${blur}`);
      if (sharpen > 0) modifiers.push(`sharpen_${sharpen}`);
      if (rotate > 0) modifiers.push(`rotate_${rotate}`);
      if (flip) modifiers.push("flip");
      if (flop) modifiers.push("flop");
    }

    // Color modifiers (only if enabled)
    if (colorEnabled) {
      // IPX modulate: brightness, saturation, hue
      const hasBrightness = brightness !== 100;
      const hasSaturate = saturate !== 100;
      const hasHueRotate = hueRotate !== 0;

      if (hasBrightness || hasSaturate || hasHueRotate) {
        modifiers.push(`modulate_${brightness}_${saturate}_${hueRotate}`);
      }

      if (contrast !== 100) modifiers.push(`contrast_${contrast / 100}`);
      if (sepia > 0) modifiers.push(`sepia_${sepia}`);
      if (grayscale) modifiers.push("grayscale");
      if (invert) modifiers.push("negate");
    }

    return modifiers.length > 0
      ? `/${modifiers.join(",")}/image.png`
      : "/image.png";
  }

  // Build CSS filter string for preview
  function buildFilterStyle() {
    const filters: string[] = [];

    if (transformEnabled) {
      if (blur > 0) filters.push(`blur(${blur}px)`);
      if (sharpen > 0) filters.push(`contrast(${100 + sharpen * 10}%)`);
    }

    if (colorEnabled) {
      if (grayscale) filters.push("grayscale(100%)");
      filters.push(`brightness(${brightness}%)`);
      filters.push(`saturate(${saturate}%)`);
      filters.push(`contrast(${contrast}%)`);
      filters.push(`hue-rotate(${hueRotate}deg)`);
      if (invert) filters.push("invert(100%)");
      if (sepia > 0) filters.push(`sepia(${sepia}%)`);
    }

    return filters.join(" ");
  }

  // Build CSS transform string for preview
  function buildTransformStyle() {
    if (!transformEnabled) return "";

    const transforms: string[] = [];
    if (rotate > 0) transforms.push(`rotate(${rotate}deg)`);
    if (flip) transforms.push("scaleY(-1)");
    if (flop) transforms.push("scaleX(-1)");

    return transforms.join(" ");
  }

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
        <div className="w-full space-y-3 lg:col-span-2">
          {/* Transform Controls */}
          <ControlCard>
            <SectionHeader
              title="Transform"
              enabled={transformEnabled}
              onToggle={setTransformEnabled}
            />
            <div
              className={cn(
                "grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2",
                !transformEnabled && "pointer-events-none",
              )}
            >
              <SliderControl
                label="Rotate"
                value={rotate}
                onChange={setRotate}
                min={0}
                max={360}
                step={90}
                unit="°"
                disabled={!transformEnabled}
              />
              <SliderControl
                label="Blur"
                value={blur}
                onChange={setBlur}
                min={0}
                max={20}
                step={1}
                disabled={!transformEnabled}
              />
              <SliderControl
                label="Sharpen"
                value={sharpen}
                onChange={setSharpen}
                min={0}
                max={10}
                step={1}
                disabled={!transformEnabled}
              />
              <div
                className={cn(
                  "flex items-end justify-center gap-3 pb-1 sm:gap-4",
                  !transformEnabled && "opacity-50",
                )}
              >
                <ToggleControl
                  id="flip"
                  label="Flip (V)"
                  checked={flip}
                  onChange={setFlip}
                  disabled={!transformEnabled}
                />
                <ToggleControl
                  id="flop"
                  label="Flop (H)"
                  checked={flop}
                  onChange={setFlop}
                  disabled={!transformEnabled}
                />
              </div>
            </div>
          </ControlCard>

          {/* Color Adjustments */}
          <ControlCard>
            <SectionHeader
              title="Color Adjustments"
              enabled={colorEnabled}
              onToggle={setColorEnabled}
            />
            <div
              className={cn(
                "grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2",
                !colorEnabled && "pointer-events-none",
              )}
            >
              <SliderControl
                label="Brightness"
                value={brightness}
                onChange={setBrightness}
                min={0}
                max={200}
                step={5}
                unit="%"
                disabled={!colorEnabled}
              />
              <SliderControl
                label="Contrast"
                value={contrast}
                onChange={setContrast}
                min={0}
                max={200}
                step={5}
                unit="%"
                disabled={!colorEnabled}
              />
              <SliderControl
                label="Saturate"
                value={saturate}
                onChange={setSaturate}
                min={0}
                max={200}
                step={5}
                unit="%"
                disabled={!colorEnabled}
              />
              <SliderControl
                label="Hue Rotate"
                value={hueRotate}
                onChange={setHueRotate}
                min={0}
                max={360}
                step={15}
                unit="°"
                disabled={!colorEnabled}
              />
              <SliderControl
                label="Sepia"
                value={sepia}
                onChange={setSepia}
                min={0}
                max={100}
                step={5}
                unit="%"
                disabled={!colorEnabled}
              />
              <div
                className={cn(
                  "flex items-end justify-center gap-3 pb-1 sm:gap-4",
                  !colorEnabled && "opacity-50",
                )}
              >
                <ToggleControl
                  id="grayscale"
                  label="Grayscale"
                  checked={grayscale}
                  onChange={setGrayscale}
                  disabled={!colorEnabled}
                />
                <ToggleControl
                  id="invert"
                  label="Invert"
                  checked={invert}
                  onChange={setInvert}
                  disabled={!colorEnabled}
                />
              </div>
            </div>
          </ControlCard>

          {/* API URL */}
          <ControlCard>
            <Label className="mb-1.5 text-xs font-medium">API URL</Label>
            <CodeBlock code={buildUrl()} />
          </ControlCard>
        </div>

        <ImagePreview
          imageUrl={DEMO_IMAGE}
          imageAlt="Effects demo"
          imageContainerClassName="bg-muted"
          aspectRatio={4 / 3}
          imageStyle={{
            objectFit: "cover",
            transform: buildTransformStyle(),
            filter: buildFilterStyle(),
          }}
        />
      </DemoLayout>
    </div>
  );
}
