"use client";

import Image, { type ImageProps, type ImageLoaderProps } from "next/image";

type OptStuffImageProps = Omit<ImageProps, "src" | "loader"> & {
  /** Full URL of the original image (e.g. "https://images.unsplash.com/photo-xxx") */
  src: string;
  /** Output format (default: "webp") */
  format?: "webp" | "avif" | "png" | "jpg";
  /** Crop / fit mode (default: "cover") */
  fit?: "cover" | "contain" | "fill";
};

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
 * @example
 * ```tsx
 * <OptStuffImage
 *   src="https://images.unsplash.com/photo-xxx"
 *   width={800}
 *   height={600}
 *   alt="Landscape"
 *   format="avif"
 *   quality={90}
 * />
 *
 * // Fill mode — Next.js generates srcSet from deviceSizes automatically
 * <div style={{ position: "relative", width: "100%", height: 400 }}>
 *   <OptStuffImage
 *     src="https://images.unsplash.com/photo-xxx"
 *     fill
 *     sizes="(min-width: 768px) 50vw, 100vw"
 *     alt="Hero"
 *     style={{ objectFit: "cover" }}
 *   />
 * </div>
 * ```
 */
export function OptStuffImage({
  src,
  alt,
  format = "webp",
  fit = "cover",
  quality = 80,
  ...rest
}: OptStuffImageProps) {
  const loader = ({ src: loaderSrc, width, quality: q }: ImageLoaderProps) => {
    const params = new URLSearchParams({
      url: loaderSrc,
      w: String(width),
      q: String(q ?? 80),
      f: format,
      fit,
    });
    return `/api/optstuff?${params}`;
  };

  return <Image {...rest} src={src} alt={alt} quality={quality} loader={loader} />;
}
