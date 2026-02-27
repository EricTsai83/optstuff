"use client";

import { OptStuffImage } from "@/components/optstuff-image";

function buildOptStuffUrl(
  src: string,
  width: number,
  quality: number,
  format: string,
  fit: string,
) {
  const params = new URLSearchParams({
    url: src,
    w: String(width),
    q: String(quality),
    f: format,
    fit,
  });
  return `/api/optstuff?${params}`;
}

type BlurImageProps = {
  src: string;
  alt: string;
  width: number;
  quality?: number;
  format?: "webp" | "avif" | "png" | "jpg";
  fit?: "cover" | "contain" | "fill";
  /** Width of the tiny blur placeholder (default: 32) */
  blurWidth?: number;
  /** Quality of the blur placeholder (default: 20) */
  blurQuality?: number;
  /** Transition duration in ms (default: 800) */
  transitionDuration?: number;
  /** Allow replaying the blur-to-clear transition */
  replayable?: boolean;
  className?: string;
  aspectRatio?: string;
  /** Delay before starting to load the full image in ms (default: 0) */
  loadDelay?: number;
  /** Pre-fetched base64 data URL for the blur placeholder (skips client fetch) */
  blurDataUrl?: string;
  /** Prioritize above-the-fold image loading (hero image use case) */
  priority?: boolean;
  /** Text shown when the full image fails to load */
  fallbackText?: string;
  /** Show a retry button when the full image fails to load */
  showRetryOnError?: boolean;
};

/**
 * Demonstrates the blur-to-clear loading pattern using OptStuff.
 *
 * Loads a tiny placeholder (~1KB) through OptStuff first, displays it with
 * CSS blur, then crossfades to the full optimised image once loaded.
 */
export function BlurImage({
  src,
  alt,
  width,
  quality = 80,
  format = "webp",
  fit = "cover",
  blurWidth = 32,
  blurQuality = 20,
  transitionDuration = 800,
  replayable = false,
  className = "",
  aspectRatio = "4/3",
  loadDelay = 0,
  blurDataUrl,
  priority = false,
  fallbackText = "Image failed to load",
  showRetryOnError = true,
}: BlurImageProps) {
  const objectFit = fit === "contain" ? "contain" : fit === "fill" ? "fill" : "cover";

  return (
    <div
      className={`blur-image-container group relative overflow-hidden ${className}`}
      style={{ aspectRatio }}
    >
      <OptStuffImage
        src={src}
        alt={alt}
        fill
        sizes={`${width}px`}
        quality={quality}
        format={format}
        fit={fit}
        priority={priority}
        blurPlaceholder
        blurWidth={blurWidth}
        blurQuality={blurQuality}
        blurTransitionDuration={transitionDuration}
        loadDelay={loadDelay}
        replayable={replayable}
        blurDataUrl={blurDataUrl}
        fallbackText={fallbackText}
        showRetryOnError={showRetryOnError}
        style={{ objectFit }}
      />
    </div>
  );
}

type BlurImageComparisonProps = {
  src: string;
  alt: string;
  width: number;
  quality?: number;
  format?: "webp" | "avif" | "png" | "jpg";
  fit?: "cover" | "contain" | "fill";
  blurWidth?: number;
  blurQuality?: number;
};

/**
 * Side-by-side comparison of blur placeholder vs. optimised image.
 */
export function BlurImageComparison({
  src,
  alt,
  width,
  quality = 80,
  format = "webp",
  fit = "cover",
  blurWidth = 32,
  blurQuality = 20,
}: BlurImageComparisonProps) {
  const blurSrc = buildOptStuffUrl(src, blurWidth, blurQuality, format, fit);
  const fullSrc = buildOptStuffUrl(src, width, quality, format, fit);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <div className="aspect-4/3 relative overflow-hidden rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={blurSrc}
            alt=""
            aria-hidden
            className="h-full w-full object-cover"
            style={{ filter: "blur(20px)", transform: "scale(1.1)" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              ~1 KB placeholder
            </span>
          </div>
        </div>
        <p className="text-center text-xs text-zinc-500">
          Blur Placeholder &middot; {blurWidth}px &middot; q{blurQuality}
        </p>
      </div>
      <div className="space-y-2">
        <div className="aspect-4/3 relative overflow-hidden rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fullSrc} alt={alt} className="h-full w-full object-cover" />
        </div>
        <p className="text-center text-xs text-zinc-500">
          Optimised &middot; {width}px &middot; q{quality} &middot; {format}
        </p>
      </div>
    </div>
  );
}
