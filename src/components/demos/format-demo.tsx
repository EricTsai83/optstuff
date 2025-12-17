"use client";

import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { ORIGINAL_SIZE_KB, FORMAT_SIZES, DEMO_IMAGE } from "./constants";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Format Conversion</h3>
          <p className="text-muted-foreground text-sm">
            Convert to modern formats like WebP and AVIF
          </p>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground mb-1 text-xs tracking-wide uppercase">
            Original: {ORIGINAL_SIZE_KB} KB
          </p>
          <p className="text-accent font-mono text-sm font-semibold">
            {selectedFormat?.savings} smaller
          </p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <Label className="text-sm">Output Format</Label>
          <RadioGroup
            value={format}
            onValueChange={setFormat}
            className="space-y-2"
          >
            {formats.map((f) => (
              <div
                key={f.value}
                className={`flex cursor-pointer items-center justify-between rounded-xl border-2 p-4 transition-all ${
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

          <div className="rounded-xl bg-[#18181b] p-4">
            <p className="mb-2 text-xs text-[#71717a]">API URL</p>
            <code className="font-mono text-sm break-all text-[#a1a1aa]">
              /f_{format}/image.png
            </code>
          </div>
        </div>

        <div className="bg-muted/50 flex min-h-[320px] flex-col items-center justify-center rounded-xl p-6">
          <div className="bg-muted ring-border mb-4 h-48 w-64 overflow-hidden rounded-lg ring-1">
            <img
              src={DEMO_IMAGE}
              alt="Format conversion demo"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex items-center gap-2 text-sm">
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
        </div>
      </div>
    </div>
  );
}
