"use client";

import Image, { type ImageProps, type ImageLoaderProps } from "next/image";
import { useState, useCallback, useEffect } from "react";

type OptStuffImageProps = Omit<ImageProps, "src" | "loader"> & {
  /** Full URL of the original image (e.g. "https://images.unsplash.com/photo-xxx") */
  src: string;
  /** Output format (default: "webp") */
  format?: "webp" | "avif" | "png" | "jpg";
  /** Crop / fit mode (default: "cover") */
  fit?: "cover" | "contain" | "fill";
  /**
   * Enable blur-to-clear placeholder via OptStuff.
   * When true, a tiny low-quality variant is loaded first and displayed
   * with CSS blur, then crossfades to the full image on load.
   */
  blurPlaceholder?: boolean;
  /** Transition duration for blur-to-clear in ms (default: 600) */
  blurTransitionDuration?: number;
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

function buildPlaceholderUrl(src: string, format: string, fit: string) {
  const params = new URLSearchParams({
    url: src,
    w: "32",
    q: "20",
    f: format,
    fit,
  });
  return `/api/optstuff?${params}`;
}

type LoadTokenOptions = {
  src: string;
  blurPlaceholder: boolean;
  format: "webp" | "avif" | "png" | "jpg";
  fit: "cover" | "contain" | "fill";
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
  className = "",
  style,
  onLoad,
  width,
  height,
  sizes,
  fill,
  ...rest
}: OptStuffImageProps) {
  const currentLoadToken = buildLoadToken({
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
  const [loadedToken, setLoadedToken] = useState<string>(() =>
    blurPlaceholder ? "" : currentLoadToken,
  );
  useEffect(() => {
    setLoadedToken(blurPlaceholder ? "" : currentLoadToken);
  }, [blurPlaceholder, currentLoadToken]);
  const loaded = !blurPlaceholder || loadedToken === currentLoadToken;

  const loader = makeLoader(format, fit);

  const handleLoad = useCallback<React.ReactEventHandler<HTMLImageElement>>(
    (e) => {
      setLoadedToken(currentLoadToken);
      onLoad?.(e);
    },
    [currentLoadToken, onLoad],
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
      />
    );
  }

  const placeholderUrl = buildPlaceholderUrl(src, format, fit);

  return (
    <div className="relative overflow-hidden" style={{ width: "100%", height: "100%" }}>
      {/* Tiny blur placeholder */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={placeholderUrl}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full"
        style={{
          objectFit: (style as React.CSSProperties)?.objectFit ?? "cover",
          filter: "blur(20px)",
          transform: "scale(1.1)",
          opacity: loaded ? 0 : 1,
          transition: `opacity ${blurTransitionDuration}ms ease-out`,
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
        className={className}
        style={{
          ...style,
          opacity: loaded ? 1 : 0,
          transition: `opacity ${blurTransitionDuration}ms ease-out`,
        }}
      />
    </div>
  );
}
