"use client";

import Image, { type ImageProps, type ImageLoaderProps } from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type ImageFormat = "webp" | "avif" | "png" | "jpg";
type ImageFit = "cover" | "contain" | "fill";
type LoadPhase = "blur" | "loading" | "sharp";

type OptStuffImageProps = Omit<ImageProps, "src" | "loader"> & {
  /** Full URL of the original image (e.g. "https://images.unsplash.com/photo-xxx") */
  src: string;
  /** Output format (default: "webp") */
  format?: ImageFormat;
  /** Crop / fit mode (default: "cover") */
  fit?: ImageFit;
  /**
   * Enable blur-to-clear placeholder via OptStuff.
   * When true, a tiny low-quality variant is loaded first and displayed
   * with CSS blur, then crossfades to the full image on load.
   */
  blurPlaceholder?: boolean;
  /** Transition duration for blur-to-clear in ms (default: 600) */
  blurTransitionDuration?: number;
  /** Width of the tiny blur placeholder (default: 32) */
  blurWidth?: number;
  /** Quality of the blur placeholder (default: 20) */
  blurQuality?: number;
  /** Delay before loading the full image in ms (default: 0) */
  loadDelay?: number;
  /** Allow replaying the blur-to-clear transition */
  replayable?: boolean;
  /** Pre-fetched base64 data URL for the blur placeholder */
  blurDataUrl?: string;
  /** Text shown when the full image fails to load */
  fallbackText?: string;
  /** Show retry button when full image fails to load */
  showRetryOnError?: boolean;
};

function makeLoader(format: string, fit: string) {
  return ({ src: loaderSrc, width, quality: q }: ImageLoaderProps) => {
    const params = new URLSearchParams({
      url: loaderSrc,
      w: String(width),
      q: String(q ?? 80),
      f: format,
      fit,
    });
    return `/api/optstuff?${params}`;
  };
}

function buildPlaceholderUrl(
  src: string,
  format: ImageFormat,
  fit: ImageFit,
  blurWidth: number,
  blurQuality: number,
) {
  const params = new URLSearchParams({
    url: src,
    w: String(blurWidth),
    q: String(blurQuality),
    f: format,
    fit,
  });
  return `/api/optstuff?${params}`;
}

type LoadTokenOptions = {
  src: string;
  blurPlaceholder: boolean;
  format: ImageFormat;
  fit: ImageFit;
  quality: NonNullable<ImageProps["quality"]>;
  width?: ImageProps["width"];
  height?: ImageProps["height"];
  sizes?: ImageProps["sizes"];
  fill?: ImageProps["fill"];
};

function buildLoadToken({
  src,
  blurPlaceholder,
  format,
  fit,
  quality,
  width,
  height,
  sizes,
  fill,
}: LoadTokenOptions) {
  return [
    src,
    blurPlaceholder ? "blur" : "plain",
    format,
    fit,
    String(quality),
    `w:${String(width ?? "")}`,
    `h:${String(height ?? "")}`,
    `sizes:${sizes ?? ""}`,
    `fill:${fill ? "1" : "0"}`,
  ].join("|");
}

/**
 * Drop-in `next/image` wrapper that serves images through OptStuff.
 *
 * Uses a custom `loader` backed by `/api/optstuff` — an API route that
 * signs the URL server-side, then 302-redirects to the optimised image.
 *
 * This preserves **all** `next/image` benefits (responsive `srcSet`, priority
 * preloading, lazy loading, `sizes`, placeholder support, etc.) while keeping
 * the signing secret on the server.
 *
 * When `blurPlaceholder` is enabled, a tiny version of the image is loaded via
 * OptStuff and displayed with CSS blur while the full image loads.
 */
export function OptStuffImage({
  src,
  alt,
  format = "webp",
  fit = "cover",
  quality = 80,
  blurPlaceholder = false,
  blurTransitionDuration = 600,
  blurWidth = 32,
  blurQuality = 20,
  loadDelay = 0,
  replayable = false,
  blurDataUrl,
  fallbackText = "Image failed to load",
  showRetryOnError = true,
  className = "",
  style,
  onLoad,
  onError,
  width,
  height,
  sizes,
  fill,
  ...rest
}: OptStuffImageProps) {
  const baseLoadToken = buildLoadToken({
    src,
    blurPlaceholder,
    format,
    fit,
    quality,
    width,
    height,
    sizes,
    fill,
  });
  const [replayKey, setReplayKey] = useState(0);
  const currentLoadToken = `${baseLoadToken}|${replayKey}`;
  const [phase, setPhase] = useState<LoadPhase>(() => {
    if (!blurPlaceholder) return "sharp";
    return loadDelay === 0 ? "loading" : "blur";
  });
  const [loadedToken, setLoadedToken] = useState<string>(() => {
    return blurPlaceholder ? "" : currentLoadToken;
  });
  const [failedToken, setFailedToken] = useState<string | null>(null);
  const fullImgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!blurPlaceholder) {
      const raf = requestAnimationFrame(() => {
        setPhase("sharp");
        setLoadedToken(currentLoadToken);
        setFailedToken(null);
      });
      return () => cancelAnimationFrame(raf);
    }

    const resetRaf = requestAnimationFrame(() => {
      setLoadedToken("");
      setFailedToken(null);
      setPhase(loadDelay === 0 ? "loading" : "blur");
    });
    if (loadDelay === 0) return () => cancelAnimationFrame(resetRaf);

    const timer = window.setTimeout(() => {
      setPhase("loading");
    }, loadDelay);
    return () => {
      cancelAnimationFrame(resetRaf);
      window.clearTimeout(timer);
    };
  }, [blurPlaceholder, currentLoadToken, loadDelay]);

  useEffect(() => {
    if (!blurPlaceholder || phase === "blur") return;
    const img = fullImgRef.current;
    if (!img || !img.complete || img.naturalWidth <= 0) return;

    const raf = requestAnimationFrame(() => {
      setLoadedToken(currentLoadToken);
      setFailedToken(null);
      setPhase("sharp");
    });

    return () => cancelAnimationFrame(raf);
  }, [blurPlaceholder, currentLoadToken, phase]);

  const hasLoadError = failedToken === currentLoadToken;
  const loaded =
    !blurPlaceholder || (loadedToken === currentLoadToken && !hasLoadError);

  const loader = makeLoader(format, fit);

  const handleLoad = useCallback<React.ReactEventHandler<HTMLImageElement>>(
    (e) => {
      setFailedToken(null);
      setLoadedToken(currentLoadToken);
      setPhase("sharp");
      onLoad?.(e);
    },
    [currentLoadToken, onLoad],
  );

  const handleError = useCallback<React.ReactEventHandler<HTMLImageElement>>(
    (e) => {
      setFailedToken(currentLoadToken);
      setPhase("sharp");
      onError?.(e);
    },
    [currentLoadToken, onError],
  );

  const replay = useCallback(() => {
    if (!blurPlaceholder) return;
    setReplayKey((k) => k + 1);
  }, [blurPlaceholder]);

  if (!blurPlaceholder) {
    return (
      <Image
        {...rest}
        src={src}
        alt={alt}
        quality={quality}
        width={width}
        height={height}
        sizes={sizes}
        fill={fill}
        loader={loader}
        className={className}
        style={style}
        onLoad={onLoad}
        onError={onError}
      />
    );
  }

  const placeholderUrl =
    blurDataUrl ??
    buildPlaceholderUrl(src, format, fit, blurWidth, blurQuality);
  const objectFit = (style as React.CSSProperties | undefined)?.objectFit ?? fit;

  return (
    <div
      className={`relative overflow-hidden ${replayable ? "group" : ""}`}
      style={{ width: "100%", height: "100%" }}
    >
      {/* Tiny blur placeholder */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={placeholderUrl}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full"
        style={{
          objectFit,
          filter: "blur(20px)",
          transform: "scale(1.1)",
          opacity: loaded ? 0 : 1,
          transition: `opacity ${blurTransitionDuration}ms ease-out`,
        }}
      />

      {phase !== "blur" && (
        <Image
          {...rest}
          key={`full-${currentLoadToken}`}
          ref={fullImgRef}
          src={src}
          alt={alt}
          quality={quality}
          width={width}
          height={height}
          sizes={sizes}
          fill={fill}
          loader={loader}
          onLoad={handleLoad}
          onError={handleError}
          className={className}
          style={{
            ...style,
            opacity: loaded ? 1 : 0,
            transition: `opacity ${blurTransitionDuration}ms ease-out`,
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

      {replayable && phase === "sharp" && !hasLoadError && (
        <button
          type="button"
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
