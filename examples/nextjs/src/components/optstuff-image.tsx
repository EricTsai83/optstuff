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
  /**
   * Duration (ms) for the blur placeholder to fade out.
   * Set to `0` to keep blur static and only fade the sharp image in.
   */
  blurFadeOutMs?: number;
  /** Delay (ms) before blur fade-out starts (only when `blurFadeOutMs > 0`). */
  blurFadeOutDelayMs?: number;
  /**
   * Grace period (ms) before blur is shown. If the sharp image loads within
   * this window (e.g. from browser cache), blur is never rendered and no
   * transition occurs. Set to 0 to always show blur immediately.
   */
  blurShowDelayMs?: number;
  /** CSS easing function for both layers. */
  easing?: string;
  /**
   * When `true`, cached/fast loads still run a short blur-to-sharp transition
   * instead of skipping directly to final sharp state.
   */
  fastLoadTransition?: boolean;
};

// ─── Transition Presets ──────────────────────────────────────────────────────

type ResolvedTransition = Required<TransitionConfig>;

const TRANSITION_PRESETS: Record<TransitionPreset, ResolvedTransition> = {
  instant: {
    sharpFadeInMs: 0,
    blurFadeOutMs: 0,
    blurFadeOutDelayMs: 0,
    blurShowDelayMs: 0,
    easing: "linear",
    fastLoadTransition: false,
  },
  smooth: {
    sharpFadeInMs: 380,
    blurFadeOutMs: 0,
    blurFadeOutDelayMs: 0,
    blurShowDelayMs: 70,
    easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    fastLoadTransition: true,
  },
  cinematic: {
    sharpFadeInMs: 600,
    blurFadeOutMs: 0,
    blurFadeOutDelayMs: 0,
    blurShowDelayMs: 100,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    fastLoadTransition: true,
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
    blurShowDelayMs: Math.max(
      0,
      overrides?.blurShowDelayMs ?? base.blurShowDelayMs,
    ),
    easing: overrides?.easing ?? base.easing,
    fastLoadTransition:
      overrides?.fastLoadTransition ?? base.fastLoadTransition,
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
}) {
  const { format, fit } = options ?? {};
  return useCallback(
    ({ src, width, quality }: ImageLoaderProps) =>
      buildOptStuffProxyPath({ src, width, quality, format, fit }),
    [format, fit],
  );
}

// ─── Component Props ─────────────────────────────────────────────────────────

export type OptStuffImageProps = Omit<ImageProps, "src" | "loader"> & {
  src: string;
  format?: ImageFormat;
  fit?: ImageFit;
  /**
   * When `true`, the `src` is treated as an already-signed OptStuff URL
   * (generated server-side via `generateOptStuffUrl`). The component renders
   * it with `unoptimized` and skips the client-side proxy loader entirely.
   */
  preSigned?: boolean;
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
  preSigned = false,
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
  const loader = useOptStuffLoader({ format, fit });

  const imageProps = preSigned ? { unoptimized: true as const } : { loader };

  if (!blurPlaceholder) {
    return (
      <Image
        {...rest}
        {...imageProps}
        src={src}
        alt={alt}
        quality={quality}
        width={width}
        height={height}
        sizes={sizes}
        fill={fill}
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
      {...imageProps}
      src={src}
      alt={alt}
      format={format}
      fit={fit}
      quality={quality}
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

type BlurToSharpImageProps = Omit<ImageProps, "src"> & {
  src: string;
  format: ImageFormat;
  fit: ImageFit;
  blurDataUrl?: string;
  blurWidth: number;
  blurQuality: number;
  transitionPreset: TransitionPreset;
  transitionConfig?: TransitionConfig;
};

type TransitionPhase =
  | "pending"
  | "loading"
  | "fast-reveal-prep"
  | "revealing"
  | "done";

/**
 * Renders two stacked `<Image>` layers and orchestrates a staggered crossfade
 * with a grace period that avoids unnecessary blur flashes on cached images.
 *
 *   1. **pending** — grace period; blur is NOT rendered, sharp loads at
 *      opacity 0. If the sharp image loads within this window (browser cache
 *      hit), behavior depends on `fastLoadTransition`:
 *      - `false`: jump straight to **done** (no blur rendered).
 *      - `true`: run a short reveal pass with a transient blur layer.
 *   2. **loading** — grace period expired; blur fades in, sharp still loading.
 *   3. **revealing** — sharp loaded; sharp fades in, blur optionally fades out.
 *   4. **done** — blur removed from DOM, `will-change` cleared.
 */
function BlurToSharpImage({
  src,
  alt,
  format,
  fit,
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

  const [phase, setPhase] = useState<TransitionPhase>(
    transition.blurShowDelayMs > 0 ? "pending" : "loading",
  );
  const [hasError, setHasError] = useState(false);
  const sharpLoaded = useRef(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const cleanupTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (transition.blurShowDelayMs <= 0) return;

    blurTimer.current = setTimeout(() => {
      if (!sharpLoaded.current) {
        setPhase("loading");
      }
    }, transition.blurShowDelayMs);

    return () => clearTimeout(blurTimer.current);
  }, [transition.blurShowDelayMs]);

  useEffect(() => {
    if (phase !== "fast-reveal-prep") return;

    const rafId = requestAnimationFrame(() => setPhase("revealing"));
    return () => cancelAnimationFrame(rafId);
  }, [phase]);

  useEffect(() => {
    if (phase !== "revealing") return;

    const blurFadeTailMs =
      transition.blurFadeOutMs > 0
        ? transition.blurFadeOutDelayMs + transition.blurFadeOutMs
        : 0;
    const totalMs =
      transition.sharpFadeInMs + blurFadeTailMs;
    cleanupTimer.current = setTimeout(() => setPhase("done"), totalMs + 60);

    return () => clearTimeout(cleanupTimer.current);
  }, [phase, transition]);

  const handleLoad = useCallback<ReactEventHandler<HTMLImageElement>>(
    (e) => {
      sharpLoaded.current = true;
      clearTimeout(blurTimer.current);

      setPhase((current) => {
        if (current === "pending") {
          return transition.fastLoadTransition ? "fast-reveal-prep" : "done";
        }
        if (current === "done") return "done";
        return "revealing";
      });

      onLoad?.(e);
    },
    [onLoad, transition.fastLoadTransition],
  );

  const handleError = useCallback<ReactEventHandler<HTMLImageElement>>(
    (e) => {
      sharpLoaded.current = true;
      clearTimeout(blurTimer.current);
      setHasError(true);
      setPhase((current) => (current === "pending" ? "done" : "revealing"));
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
  const showBlur =
    phase === "loading" ||
    phase === "fast-reveal-prep" ||
    phase === "revealing";
  const revealed = phase === "revealing" || phase === "done";
  const blurFadesOut = transition.blurFadeOutMs > 0;

  return (
    <div
      className="relative overflow-hidden"
      style={{ width: "100%", height: "100%" }}
    >
      {showBlur && (
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
            opacity: blurFadesOut && phase === "revealing" ? 0 : 1,
            transition:
              blurFadesOut && phase === "revealing"
                ? `opacity ${transition.blurFadeOutMs}ms ${transition.easing} ${transition.blurFadeOutDelayMs}ms`
                : undefined,
            willChange:
              phase === "loading" || phase === "fast-reveal-prep"
                ? "opacity"
                : undefined,
          }}
        />
      )}

      <Image
        {...rest}
        src={src}
        alt={alt}
        quality={quality}
        width={width}
        height={height}
        sizes={sizes}
        fill={fill}
        onLoad={handleLoad}
        onError={handleError}
        className={className}
        style={{
          ...style,
          objectFit,
          opacity: revealed ? 1 : 0,
          transition:
            phase === "revealing"
              ? `opacity ${transition.sharpFadeInMs}ms ${transition.easing}`
              : undefined,
          willChange:
            phase === "pending" ||
            phase === "loading" ||
            phase === "fast-reveal-prep"
              ? "opacity"
              : undefined,
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
