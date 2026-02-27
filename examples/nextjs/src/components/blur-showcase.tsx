"use client";

import { OptStuffImage } from "@/components/optstuff-image";
import { useState } from "react";

type ShowcaseImage = {
  label: string;
  src: string;
  format: "webp" | "avif" | "png" | "jpg";
  quality: number;
};

type BlurShowcaseProps = {
  images: readonly ShowcaseImage[];
};

export function BlurShowcase({ images }: BlurShowcaseProps) {
  const [replaySeed, setReplaySeed] = useState(0);

  return (
    <section id="demo" className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-4 text-center">
          <span className="mb-3 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
            Core Pattern
          </span>
          <h2 className="text-foreground mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Blur-to-Clear Loading
          </h2>
          <p className="text-muted mx-auto max-w-lg">
            Serve a ~1 KB blurred placeholder, then crossfade to the full image
            — one API, both variants.
          </p>
          <button
            type="button"
            onClick={() => setReplaySeed((v) => v + 1)}
            className="mt-5 inline-flex w-full cursor-pointer items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500/90 active:scale-95 sm:w-auto"
          >
            Replay Blur Effect
          </button>
        </div>

        <div className="mt-8 grid gap-5 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
          {images.map((img) => (
            <div
              key={`${img.label}-${img.src}`}
              className="border-border bg-card overflow-hidden rounded-xl border shadow-sm"
            >
              <div className="aspect-4/3 relative overflow-hidden">
                <OptStuffImage
                  key={`${img.src}-${replaySeed}`}
                  src={img.src}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  alt={img.label}
                  format={img.format}
                  quality={img.quality}
                  fit="cover"
                  blurPlaceholder
                  transitionPreset="smooth"
                  transitionConfig={{
                    blurFadeDurationMs: 320,
                    sharpFadeDurationMs: 220,
                    sharpStartOpacity: 0.18,
                  }}
                />
              </div>
              <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-foreground text-sm font-medium">
                    {img.label}
                  </span>
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {img.format}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
