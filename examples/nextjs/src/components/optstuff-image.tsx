"use client";

import Image, { type ImageLoaderProps, type ImageProps } from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type ImageFormat = "webp" | "avif" | "png" | "jpg";
type ImageFit = "cover" | "contain" | "fill";
type LoadPhase = "blur" | "loading" | "sharp";
type TransitionPreset = "instant" | "smooth" | "cinematic";

type TransitionConfig = {
  blurFadeDurationMs?: number;
  sharpFadeDurationMs?: number;
  minBlurVisibleMs?: number;
  sharpStartOpacity?: number;
  easing?: string;
};

const TRANSITION_PRESETS: Record<
  TransitionPreset,
  {
    blurFadeDurationMs: number;
    sharpFadeDurationMs: number;
    minBlurVisibleMs: number;
    sharpStartOpacity: number;
    easing: string;
  }
> = {
  instant: {
    blurFadeDurationMs: 0,
    sharpFadeDurationMs: 0,
    minBlurVisibleMs: 0,
    sharpStartOpacity: 1,
    easing: "linear",
  },
  smooth: {
    blurFadeDurationMs: 280,
    sharpFadeDurationMs: 220,
    minBlurVisibleMs: 100,
    sharpStartOpacity: 0.18,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  },
  cinematic: {
    blurFadeDurationMs: 420,
    sharpFadeDurationMs: 340,
    minBlurVisibleMs: 140,
    sharpStartOpacity: 0.12,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  },
};

type OptStuffImageProps = Omit<ImageProps, "src" | "loader" | "priority"> & {
  src: string;
  format?: ImageFormat;
  fit?: ImageFit;
  blurPlaceholder?: boolean;
  transitionPreset?: TransitionPreset;
  transitionConfig?: TransitionConfig;
  blurTransitionDuration?: number;
  sharpFadeDuration?: number;
  blurWidth?: number;
  blurQuality?: number;
  loadDelay?: number;
  minBlurVisibleMs?: number;
  blurDataUrl?: string;
  fallbackText?: string;
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

export function OptStuffImage({
  src,
  alt,
  format = "webp",
  fit = "cover",
  quality = 80,
  blurPlaceholder = false,
  transitionPreset = "smooth",
  transitionConfig,
  blurTransitionDuration,
  sharpFadeDuration,
  blurWidth = 32,
  blurQuality = 20,
  loadDelay = 0,
  minBlurVisibleMs,
  blurDataUrl,
  fallbackText = "Image failed to load",
  showRetryOnError = true,
  className = "",
  style,
  preload = false,
  onLoad,
  onError,
  width,
  height,
  sizes,
  fill,
  ...rest
}: OptStuffImageProps) {
  const effectiveLoadDelay = preload ? 0 : loadDelay;
  const presetTransition = TRANSITION_PRESETS[transitionPreset];
  const effectiveBlurTransitionDuration = Math.max(
    0,
    transitionConfig?.blurFadeDurationMs ??
      blurTransitionDuration ??
      presetTransition.blurFadeDurationMs,
  );
  const effectiveSharpFadeDuration = Math.max(
    0,
    transitionConfig?.sharpFadeDurationMs ??
      sharpFadeDuration ??
      presetTransition.sharpFadeDurationMs,
  );
  const effectiveMinBlurVisibleMs = Math.max(
    0,
    transitionConfig?.minBlurVisibleMs ??
      minBlurVisibleMs ??
      presetTransition.minBlurVisibleMs,
  );
  const effectiveSharpStartOpacity = Math.min(
    1,
    Math.max(
      0,
      transitionConfig?.sharpStartOpacity ?? presetTransition.sharpStartOpacity,
    ),
  );
  const effectiveEasing = transitionConfig?.easing ?? presetTransition.easing;
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
  const [retryKey, setRetryKey] = useState(0);
  const currentLoadToken = `${baseLoadToken}|retry:${retryKey}`;
  const [phase, setPhase] = useState<LoadPhase>(() => {
    if (!blurPlaceholder) return "sharp";
    return effectiveLoadDelay === 0 ? "loading" : "blur";
  });
  const [loadedToken, setLoadedToken] = useState<string>(() => {
    return blurPlaceholder ? "" : currentLoadToken;
  });
  const [failedToken, setFailedToken] = useState<string | null>(null);
  const fullImgRef = useRef<HTMLImageElement>(null);
  const activeLoadTokenRef = useRef(currentLoadToken);
  const blurVisibleSinceRef = useRef<number>(0);
  const revealTimerRef = useRef<number | null>(null);

  useEffect(() => {
    activeLoadTokenRef.current = currentLoadToken;
  }, [currentLoadToken]);

  const clearRevealTimer = useCallback(() => {
    if (revealTimerRef.current === null) return;
    window.clearTimeout(revealTimerRef.current);
    revealTimerRef.current = null;
  }, []);

  const revealSharp = useCallback((token: string) => {
    if (activeLoadTokenRef.current !== token) return;
    setLoadedToken(token);
    setFailedToken(null);
    setPhase("sharp");
  }, []);

  const revealWithMinimumDelay = useCallback(
    (token: string) => {
      if (!blurPlaceholder) {
        revealSharp(token);
        return;
      }

      const minimum = effectiveMinBlurVisibleMs;
      if (minimum === 0) {
        revealSharp(token);
        return;
      }

      const elapsed = Date.now() - blurVisibleSinceRef.current;
      const remaining = minimum - elapsed;
      if (remaining <= 0) {
        revealSharp(token);
        return;
      }

      clearRevealTimer();
      revealTimerRef.current = window.setTimeout(() => {
        revealTimerRef.current = null;
        revealSharp(token);
      }, remaining);
    },
    [blurPlaceholder, clearRevealTimer, effectiveMinBlurVisibleMs, revealSharp],
  );

  useEffect(() => {
    return () => {
      clearRevealTimer();
    };
  }, [clearRevealTimer]);

  useEffect(() => {
    if (!blurPlaceholder) {
      clearRevealTimer();
      const raf = requestAnimationFrame(() => {
        blurVisibleSinceRef.current = Date.now();
        setPhase("sharp");
        setLoadedToken(currentLoadToken);
        setFailedToken(null);
      });
      return () => cancelAnimationFrame(raf);
    }

    clearRevealTimer();
    const resetRaf = requestAnimationFrame(() => {
      blurVisibleSinceRef.current = Date.now();
      setLoadedToken("");
      setFailedToken(null);
      setPhase(effectiveLoadDelay === 0 ? "loading" : "blur");
    });
    if (effectiveLoadDelay === 0) {
      return () => {
        clearRevealTimer();
        cancelAnimationFrame(resetRaf);
      };
    }

    const timer = window.setTimeout(() => {
      setPhase("loading");
    }, effectiveLoadDelay);
    return () => {
      clearRevealTimer();
      cancelAnimationFrame(resetRaf);
      window.clearTimeout(timer);
    };
  }, [blurPlaceholder, clearRevealTimer, currentLoadToken, effectiveLoadDelay]);

  useEffect(() => {
    if (!blurPlaceholder || phase === "blur") return;
    const img = fullImgRef.current;
    if (!img || !img.complete || img.naturalWidth <= 0) return;

    const raf = requestAnimationFrame(() => {
      revealWithMinimumDelay(currentLoadToken);
    });

    return () => cancelAnimationFrame(raf);
  }, [blurPlaceholder, currentLoadToken, phase, revealWithMinimumDelay]);

  const hasLoadError = failedToken === currentLoadToken;
  const loaded =
    !blurPlaceholder || (loadedToken === currentLoadToken && !hasLoadError);

  const loader = makeLoader(format, fit);

  const handleLoad = useCallback<React.ReactEventHandler<HTMLImageElement>>(
    (e) => {
      setFailedToken(null);
      revealWithMinimumDelay(currentLoadToken);
      onLoad?.(e);
    },
    [currentLoadToken, onLoad, revealWithMinimumDelay],
  );

  const handleError = useCallback<React.ReactEventHandler<HTMLImageElement>>(
    (e) => {
      clearRevealTimer();
      setFailedToken(currentLoadToken);
      setPhase("sharp");
      onError?.(e);
    },
    [clearRevealTimer, currentLoadToken, onError],
  );

  const retryLoad = useCallback(() => {
    if (!blurPlaceholder) return;
    setRetryKey((k) => k + 1);
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
        preload={preload}
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
      className="relative overflow-hidden"
      style={{ width: "100%", height: "100%" }}
    >
      <Image
        src={placeholderUrl}
        alt=""
        aria-hidden
        width={width}
        height={height}
        sizes={sizes}
        fill={fill}
        unoptimized
        loading={preload ? "eager" : "lazy"}
        preload={preload}
        className="absolute inset-0 h-full w-full"
        style={{
          objectFit,
          filter: "blur(18px)",
          transform: "scale(1.06)",
          opacity: loaded ? 0 : 1,
          transition: `opacity ${effectiveBlurTransitionDuration}ms ${effectiveEasing}`,
          willChange: "opacity",
        }}
      />

      {phase !== "blur" && (
        <Image
          {...rest}
          ref={fullImgRef}
          src={src}
          alt={alt}
          quality={quality}
          width={width}
          height={height}
          sizes={sizes}
          fill={fill}
          loader={loader}
          preload={preload}
          onLoad={handleLoad}
          onError={handleError}
          className={className}
          style={{
            ...style,
            objectFit,
            opacity: loaded ? 1 : effectiveSharpStartOpacity,
            transition: `opacity ${effectiveSharpFadeDuration}ms ${effectiveEasing}`,
            willChange: "opacity",
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
              onClick={retryLoad}
              className="rounded-md bg-white/90 px-3 py-1.5 text-xs font-semibold text-zinc-900 transition-colors hover:bg-white"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}
