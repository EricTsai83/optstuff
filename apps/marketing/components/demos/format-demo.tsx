"use client";

import { useState } from "react";
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group";
import { Label } from "@workspace/ui/components/label";
import { Check, FileImage } from "lucide-react";
import { CodeBlock } from "@/components/code-block";
import { ORIGINAL_SIZE_KB, FORMAT_SIZES, DEMO_IMAGE } from "./constants";
import { DemoHeader, DemoLayout, ControlCard, ImagePreview } from "./layouts";

const formats = [
  { value: "webp", label: "WebP", ...FORMAT_SIZES.webp, supported: true },
  { value: "avif", label: "AVIF", ...FORMAT_SIZES.avif, supported: true },
  { value: "jpeg", label: "JPEG", ...FORMAT_SIZES.jpeg, supported: true },
  { value: "png", label: "PNG", ...FORMAT_SIZES.png, supported: true },
];

export function FormatDemo() {
  const [format, setFormat] = useState("webp");
  const selectedFormat = formats.find((f) => f.value === format);

  return (
    <div className="space-y-4">
      <DemoHeader
        icon={<FileImage className="h-5 w-5" />}
        title="Format Conversion"
        description="Convert to modern formats like WebP and AVIF"
        action={
          <div className="text-right">
            <p className="text-muted-foreground mb-1 text-xs tracking-wide uppercase">
              Original: {ORIGINAL_SIZE_KB} KB
            </p>
            <p className="text-accent font-mono text-sm font-semibold">
              {selectedFormat?.savings} smaller
            </p>
          </div>
        }
      />

      <DemoLayout controlsColSpan={2} previewColSpan={2}>
        <div className="space-y-3 lg:col-span-2">
          <Label className="text-sm">Output Format</Label>
          <RadioGroup
            value={format}
            onValueChange={setFormat}
            className="space-y-0.5"
          >
            {formats.map((f) => (
              <div
                key={f.value}
                className={`flex cursor-pointer items-center justify-between rounded-xl border-2 px-4 py-2.5 transition-all ${
                  format === f.value
                    ? "border-accent bg-accent/5"
                    : "bg-muted/50 hover:bg-muted border-transparent"
                }`}
                onClick={() => setFormat(f.value)}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem
                    value={f.value}
                    id={f.value}
                    className="border-muted-foreground"
                  />
                  <Label
                    htmlFor={f.value}
                    className="cursor-pointer font-medium"
                  >
                    {f.label}
                  </Label>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm">{f.size}</p>
                  <p className="text-muted-foreground text-xs">
                    {f.savings} savings
                  </p>
                </div>
              </div>
            ))}
          </RadioGroup>

          <ControlCard>
            <Label className="mb-2 text-sm font-medium">API URL</Label>
            <CodeBlock code={`/f_${format}/image.png`} />
          </ControlCard>
        </div>

        <ImagePreview
          imageUrl={DEMO_IMAGE}
          imageAlt="Format conversion demo"
          containerClassName="flex-col"
          imageContainerClassName="bg-muted"
          aspectRatio={4 / 3}
          imageStyle={{ objectFit: "cover" }}
          footer={
            <div className="flex items-center gap-2 pt-1 text-sm">
              <div className="bg-accent flex h-5 w-5 items-center justify-center rounded-full">
                <Check className="text-accent-foreground h-3 w-3" />
              </div>
              <span>
                Output:{" "}
                <span className="font-mono font-medium">
                  {selectedFormat?.label}
                </span>
              </span>
              <span className="text-muted-foreground">
                ({selectedFormat?.size})
              </span>
            </div>
          }
        />
      </DemoLayout>
    </div>
  );
}
