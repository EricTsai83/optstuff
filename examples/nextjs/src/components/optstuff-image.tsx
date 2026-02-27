"use client";

import { buildOptStuffProxyPath } from "@/lib/next-image-optstuff-loader";
import Image, { type ImageLoaderProps, type ImageProps } from "next/image";
import { useCallback, useMemo, useState } from "react";
import type { CSSProperties, ReactEventHandler } from "react";

type ImageFormat = "webp" | "avif" | "png" | "jpg";
type ImageFit = "cover" | "contain" | "fill";
type TransitionPreset = "instant" | "smooth" | "cinematic";

type TransitionConfig = {
  blurFadeDurationMs?: number;
  sharpFadeDurationMs?: number;
  sharpStartOpacity?: number;
  easing?: string;
};

type ResolvedTransition = {
  blurFadeDurationMs: number;
  sharpFadeDurationMs: number;
  sharpStartOpacity: number;
  easing: string;
};

const TRANSITION_PRESETS: Record<TransitionPreset, ResolvedTransition> = {
  instant: {
    blurFadeDurationMs: 0,
    sharpFadeDurationMs: 0,
    sharpStartOpacity: 1,
    easing: "linear",
  },
  smooth: {
    blurFadeDurationMs: 280,
    sharpFadeDurationMs: 220,
    sharpStartOpacity: 0.18,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  },
  cinematic: {
    blurFadeDurationMs: 420,
    sharpFadeDurationMs: 340,
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
  blurWidth?: number;
  blurQuality?: number;
  blurDataUrl?: string;
};

type ImageLoadState = {
  loaded: boolean;
  hasLoadError: boolean;
};

function resolveTransition(
  preset: TransitionPreset,
  overrides?: TransitionConfig,
): ResolvedTransition {
  const base = TRANSITION_PRESETS[preset];
  return {
    blurFadeDurationMs: Math.max(
      0,
      overrides?.blurFadeDurationMs ?? base.blurFadeDurationMs,
    ),
    sharpFadeDurationMs: Math.max(
      0,
      overrides?.sharpFadeDurationMs ?? base.sharpFadeDurationMs,
    ),
    sharpStartOpacity: Math.min(
      1,
      Math.max(0, overrides?.sharpStartOpacity ?? base.sharpStartOpacity),
    ),
    easing: overrides?.easing ?? base.easing,
  };
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
  blurWidth = 32,
  blurQuality = 20,
  blurDataUrl,
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
  const transition = useMemo(
    () => resolveTransition(transitionPreset, transitionConfig),
    [transitionConfig, transitionPreset],
  );

  const loader = useCallback(
    ({ src: loaderSrc, width: loaderWidth, quality: loaderQuality }: ImageLoaderProps) =>
      buildOptStuffProxyPath({
        src: loaderSrc,
        width: loaderWidth,
        quality: loaderQuality,
        format,
        fit,
      }),
    [fit, format],
  );

  const loadToken = useMemo(
    () =>
      [
        src,
        format,
        fit,
        quality,
        blurPlaceholder ? "blur" : "plain",
        width ?? "",
        height ?? "",
        sizes ?? "",
        fill ? "fill" : "",
      ].join("|"),
    [blurPlaceholder, fill, fit, format, height, quality, sizes, src, width],
  );

  const [loadStateByToken, setLoadStateByToken] = useState<
    Record<string, ImageLoadState>
  >({});
  const currentState =
    loadStateByToken[loadToken] ??
    ({
      loaded: !blurPlaceholder,
      hasLoadError: false,
    } satisfies ImageLoadState);

  const handleLoad = useCallback<ReactEventHandler<HTMLImageElement>>(
    (e) => {
      setLoadStateByToken((prev) => ({
        ...prev,
        [loadToken]: { loaded: true, hasLoadError: false },
      }));
      onLoad?.(e);
    },
    [loadToken, onLoad],
  );

  const handleError = useCallback<ReactEventHandler<HTMLImageElement>>(
    (e) => {
      setLoadStateByToken((prev) => ({
        ...prev,
        [loadToken]: { loaded: true, hasLoadError: true },
      }));
      onError?.(e);
    },
    [loadToken, onError],
  );

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
    buildOptStuffProxyPath({
      src,
      width: blurWidth,
      quality: blurQuality,
      format,
      fit,
    });
  const objectFit = (style as CSSProperties | undefined)?.objectFit ?? fit;

  return (
    <div className="relative overflow-hidden" style={{ width: "100%", height: "100%" }}>
      <Image
        src={placeholderUrl}
        alt=""
        aria-hidden
        width={width}
        height={height}
        sizes={sizes}
        fill={fill}
        unoptimized
        className="absolute inset-0 h-full w-full"
        style={{
          objectFit,
          filter: "blur(16px)",
          transform: "scale(1.04)",
          opacity: currentState.loaded ? 0 : 1,
          transition: `opacity ${transition.blurFadeDurationMs}ms ${transition.easing}`,
          willChange: "opacity",
        }}
      />

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
        onLoad={handleLoad}
        onError={handleError}
        className={className}
        style={{
          ...style,
          objectFit,
          opacity: currentState.loaded ? 1 : transition.sharpStartOpacity,
          transition: `opacity ${transition.sharpFadeDurationMs}ms ${transition.easing}`,
          willChange: "opacity",
        }}
      />

      {currentState.hasLoadError ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
          <span className="rounded-md bg-black/55 px-3 py-1.5 text-xs font-medium text-white">
            Image unavailable
          </span>
        </div>
      ) : null}
    </div>
  );
}
