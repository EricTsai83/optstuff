"use client";

import { buildOptStuffProxyPath } from "@/lib/next-image-optstuff-loader";
import Image, { type ImageLoaderProps, type ImageProps } from "next/image";
import {
  type CSSProperties,
  type ReactEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// ─── Public Types ────────────────────────────────────────────────────────────

export type ImageFormat = "webp" | "avif" | "png" | "jpg";
export type ImageFit = "cover" | "contain" | "fill";
export type TransitionPreset = "instant" | "smooth" | "cinematic";

export type TransitionConfig = {
  /** Duration (ms) for the sharp image to fade in. */
  sharpFadeInMs?: number;
  /** Duration (ms) for the blur placeholder to fade out. */
  blurFadeOutMs?: number;
  /** Delay (ms) before the blur starts fading (after the sharp begins). */
  blurFadeOutDelayMs?: number;
  /** CSS easing function for both layers. */
  easing?: string;
};

// ─── Transition Presets ──────────────────────────────────────────────────────

type ResolvedTransition = Required<TransitionConfig>;

const TRANSITION_PRESETS: Record<TransitionPreset, ResolvedTransition> = {
  instant: {
    sharpFadeInMs: 0,
    blurFadeOutMs: 0,
    blurFadeOutDelayMs: 0,
    easing: "linear",
  },
  smooth: {
    sharpFadeInMs: 380,
    blurFadeOutMs: 300,
    blurFadeOutDelayMs: 100,
    easing: "cubic-bezier(0.25, 1, 0.5, 1)",
  },
  cinematic: {
    sharpFadeInMs: 600,
    blurFadeOutMs: 450,
    blurFadeOutDelayMs: 160,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  },
};

function resolveTransition(
  preset: TransitionPreset,
  overrides?: TransitionConfig,
): ResolvedTransition {
  const base = TRANSITION_PRESETS[preset];
  return {
    sharpFadeInMs: Math.max(0, overrides?.sharpFadeInMs ?? base.sharpFadeInMs),
    blurFadeOutMs: Math.max(0, overrides?.blurFadeOutMs ?? base.blurFadeOutMs),
    blurFadeOutDelayMs: Math.max(
      0,
      overrides?.blurFadeOutDelayMs ?? base.blurFadeOutDelayMs,
    ),
    easing: overrides?.easing ?? base.easing,
  };
}

// ─── Hook: OptStuff Loader ───────────────────────────────────────────────────

/**
 * Returns a `next/image`-compatible loader that routes images through the
 * OptStuff proxy endpoint (`/api/optstuff`).
 *
 * Can be used standalone with `<Image loader={loader} />` for custom layouts
 * that don't need the full `<OptStuffImage>` wrapper.
 */
export function useOptStuffLoader(options?: {
  format?: ImageFormat;
  fit?: ImageFit;
  bypassProxy?: boolean;
}) {
  const { format, fit, bypassProxy } = options ?? {};
  return useCallback(
    ({ src, width, quality }: ImageLoaderProps) =>
      bypassProxy
        ? src
        : buildOptStuffProxyPath({ src, width, quality, format, fit }),
    [bypassProxy, format, fit],
  );
}

// ─── Component Props ─────────────────────────────────────────────────────────

export type OptStuffImageProps = Omit<ImageProps, "src" | "loader"> & {
  src: string;
  format?: ImageFormat;
  fit?: ImageFit;
  bypassProxy?: boolean;
  /** Enable blur-to-sharp placeholder crossfade. */
  blurPlaceholder?: boolean;
  /** Pre-generated blur data URL (e.g. from the server). */
  blurDataUrl?: string;
  /** Width used for auto-generated blur placeholder (default 32). */
  blurWidth?: number;
  /** Quality used for auto-generated blur placeholder (default 20). */
  blurQuality?: number;
  transitionPreset?: TransitionPreset;
  transitionConfig?: TransitionConfig;
};

// ─── Component ───────────────────────────────────────────────────────────────

export function OptStuffImage({
  src,
  alt,
  format = "webp",
  fit = "cover",
  bypassProxy = false,
  quality = 80,
  blurPlaceholder = false,
  blurDataUrl,
  blurWidth = 32,
  blurQuality = 20,
  transitionPreset = "smooth",
  transitionConfig,
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
  const loader = useOptStuffLoader({ format, fit, bypassProxy });

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

  return (
    <BlurToSharpImage
      key={src}
      {...rest}
      src={src}
      alt={alt}
      format={format}
      fit={fit}
      quality={quality}
      loader={loader}
      blurDataUrl={blurDataUrl}
      blurWidth={blurWidth}
      blurQuality={blurQuality}
      transitionPreset={transitionPreset}
      transitionConfig={transitionConfig}
      className={className}
      style={style}
      onLoad={onLoad}
      onError={onError}
      width={width}
      height={height}
      sizes={sizes}
      fill={fill}
    />
  );
}

// ─── Internal: Blur-to-Sharp Crossfade ───────────────────────────────────────

type BlurToSharpImageProps = Omit<ImageProps, "src" | "loader"> & {
  src: string;
  format: ImageFormat;
  fit: ImageFit;
  loader: (props: ImageLoaderProps) => string;
  blurDataUrl?: string;
  blurWidth: number;
  blurQuality: number;
  transitionPreset: TransitionPreset;
  transitionConfig?: TransitionConfig;
};

type TransitionPhase = "loading" | "revealing" | "done";

/**
 * Renders two stacked `<Image>` layers and orchestrates a staggered crossfade:
 *
 *   1. **loading** — blur visible at full opacity, sharp at opacity 0.
 *   2. **revealing** — sharp fades in; blur fades out after a small delay so
 *      both layers overlap and there is never a visible gap.
 *   3. **done** — blur removed from DOM, `will-change` cleared.
 */
function BlurToSharpImage({
  src,
  alt,
  format,
  fit,
  loader,
  blurDataUrl,
  blurWidth,
  blurQuality,
  transitionPreset,
  transitionConfig,
  className = "",
  style,
  onLoad,
  onError,
  width,
  height,
  sizes,
  fill,
  quality,
  ...rest
}: BlurToSharpImageProps) {
  const transition = useMemo(
    () => resolveTransition(transitionPreset, transitionConfig),
    [transitionPreset, transitionConfig],
  );

  const [phase, setPhase] = useState<TransitionPhase>("loading");
  const [hasError, setHasError] = useState(false);
  const cleanupTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(cleanupTimer.current), []);

  const handleLoad = useCallback<ReactEventHandler<HTMLImageElement>>(
    (e) => {
      setPhase("revealing");

      const totalMs =
        transition.sharpFadeInMs +
        transition.blurFadeOutDelayMs +
        transition.blurFadeOutMs;
      cleanupTimer.current = setTimeout(() => setPhase("done"), totalMs + 60);

      onLoad?.(e);
    },
    [transition, onLoad],
  );

  const handleError = useCallback<ReactEventHandler<HTMLImageElement>>(
    (e) => {
      setHasError(true);
      setPhase("revealing");
      onError?.(e);
    },
    [onError],
  );

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
  const revealed = phase !== "loading";

  return (
    <div
      className="relative overflow-hidden"
      style={{ width: "100%", height: "100%" }}
    >
      {/* Blur placeholder — removed from the DOM after the crossfade finishes */}
      {phase !== "done" && (
        <Image
          src={placeholderUrl}
          alt=""
          aria-hidden
          width={width}
          height={height}
          sizes={sizes}
          fill={fill}
          unoptimized
          className="pointer-events-none absolute inset-0 h-full w-full"
          style={{
            objectFit,
            filter: "blur(20px)",
            transform: "scale(1.1)",
            opacity: revealed ? 0 : 1,
            transition: revealed
              ? `opacity ${transition.blurFadeOutMs}ms ${transition.easing} ${transition.blurFadeOutDelayMs}ms`
              : undefined,
            willChange: phase === "loading" ? "opacity" : undefined,
          }}
        />
      )}

      {/* Sharp image */}
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
          opacity: revealed ? 1 : 0,
          transition: `opacity ${transition.sharpFadeInMs}ms ${transition.easing}`,
          willChange: phase === "loading" ? "opacity" : undefined,
        }}
      />

      {hasError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
          <span className="rounded-md bg-black/55 px-3 py-1.5 text-xs font-medium text-white">
            Image unavailable
          </span>
        </div>
      )}
    </div>
  );
}
