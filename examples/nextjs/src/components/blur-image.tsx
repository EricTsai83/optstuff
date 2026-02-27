"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
  const [phase, setPhase] = useState<"blur" | "loading" | "sharp">(
    loadDelay === 0 ? "loading" : "blur",
  );
  const [key, setKey] = useState(0);
  const [failedToken, setFailedToken] = useState<string | null>(null);
  const fullImgRef = useRef<HTMLImageElement>(null);

  const blurSrc =
    blurDataUrl ?? buildOptStuffUrl(src, blurWidth, blurQuality, format, fit);
  const fullSrc = buildOptStuffUrl(src, width, quality, format, fit);
  const currentToken = `${fullSrc}|${key}`;
  const hasLoadError = failedToken === currentToken;

  const handleFullLoad = useCallback(() => {
    setFailedToken(null);
    setPhase("sharp");
  }, []);

  const handleFullError = useCallback(() => {
    setFailedToken(currentToken);
    setPhase("sharp");
  }, [currentToken]);

  useEffect(() => {
    const timer = setTimeout(() => setPhase("loading"), loadDelay);
    return () => clearTimeout(timer);
  }, [loadDelay, key]);

  // When a priority image loads before hydration finishes, React may miss onLoad.
  // Detect already-complete images after mount and promote to sharp phase.
  useEffect(() => {
    if (phase === "blur") return;
    const img = fullImgRef.current;
    if (!img) return;
    if (!img.complete || img.naturalWidth <= 0) return;

    const raf = requestAnimationFrame(() => {
      setPhase("sharp");
    });
    return () => cancelAnimationFrame(raf);
  }, [phase, fullSrc, key]);

  const replay = useCallback(() => {
    setFailedToken(null);
    setPhase("blur");
    setKey((k) => k + 1);
  }, []);

  return (
    <div
      className={`blur-image-container group relative overflow-hidden ${className}`}
      style={{ aspectRatio }}
    >
      {/* Tiny blurred placeholder */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={`blur-${key}`}
        src={blurSrc}
        alt=""
        aria-hidden
        loading="lazy"
        fetchPriority="auto"
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          filter: "blur(20px)",
          transform: "scale(1.1)",
        }}
      />

      {/* Full-resolution image */}
      {phase !== "blur" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`full-${key}`}
          ref={fullImgRef}
          src={fullSrc}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          onLoad={handleFullLoad}
          onError={handleFullError}
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            opacity: phase === "sharp" ? 1 : 0,
            transition: `opacity ${transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          }}
        />
      )}

      {hasLoadError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/45">
          <span
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            className="rounded-md bg-black/55 px-3 py-1.5 text-xs font-medium text-white"
          >
            {fallbackText}
          </span>
          {showRetryOnError && (
            <button
              type="button"
              onClick={replay}
              className="rounded-md bg-white/90 px-3 py-1.5 text-xs font-semibold text-zinc-900 transition-colors hover:bg-white"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Replay button */}
      {replayable && phase === "sharp" && (
        <button
          onClick={replay}
          className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white/90 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5">
            <path d="M5.23 1.644A8.004 8.004 0 0 1 14 8c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8V0L9 3 6 6V3.5a4.5 4.5 0 1 0 4.798 2.15l1.376-.826A6 6 0 1 1 5.23 1.644z" />
          </svg>
          Replay
        </button>
      )}
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
