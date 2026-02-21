import Image, { type ImageProps } from "next/image";

import { generateOptStuffUrl } from "@/lib/optstuff";

type OptStuffImageProps = Omit<ImageProps, "src" | "loader"> & {
  /** Full URL of the original image (e.g. "https://images.unsplash.com/photo-xxx") */
  src: string;
  /**
   * Optimization width override — useful when the display size differs from
   * the desired optimization size (e.g. 2x for retina).
   * Falls back to the `width` prop if omitted.
   */
  optimizeWidth?: number;
  /** Optimization height override. Falls back to the `height` prop if omitted. */
  optimizeHeight?: number;
  /** Output format (default: "webp") */
  format?: "webp" | "avif" | "png" | "jpg";
  /** Crop / fit mode (default: "cover") */
  fit?: "cover" | "contain" | "fill";
  /** Signed URL time-to-live in seconds (default: 3600) */
  expiresIn?: number;
};

/**
 * Drop-in `next/image` wrapper that serves images through OptStuff.
 *
 * This is a **Server Component** — the signed URL is generated on the server
 * so the secret key is never exposed to the client.
 *
 * @example
 * ```tsx
 * // Basic usage (same as next/image, just swap the import)
 * <OptStuffImage
 *   src="https://images.unsplash.com/photo-xxx"
 *   width={800}
 *   height={600}
 *   alt="Landscape"
 * />
 *
 * // With OptStuff-specific options
 * <OptStuffImage
 *   src="https://images.unsplash.com/photo-xxx"
 *   width={400}
 *   height={300}
 *   alt="Retina landscape"
 *   optimizeWidth={800}   // fetch 800px wide for 2x retina
 *   format="avif"
 *   quality={90}
 *   fit="contain"
 *   expiresIn={7200}
 * />
 *
 * // Fill mode (responsive container)
 * <div style={{ position: "relative", width: "100%", height: 400 }}>
 *   <OptStuffImage
 *     src="https://images.unsplash.com/photo-xxx"
 *     fill
 *     alt="Full-width hero"
 *     optimizeWidth={1920}
 *     style={{ objectFit: "cover" }}
 *   />
 * </div>
 * ```
 */
export function OptStuffImage({
  src,
  optimizeWidth,
  optimizeHeight,
  quality,
  format = "webp",
  fit = "cover",
  expiresIn = 3600,
  width,
  height,
  alt,
  ...rest
}: OptStuffImageProps) {
  const effectiveWidth =
    optimizeWidth ?? (typeof width === "number" ? width : undefined);
  const effectiveHeight =
    optimizeHeight ?? (typeof height === "number" ? height : undefined);
  const effectiveQuality =
    typeof quality === "string" ? parseInt(quality, 10) : (quality ?? 80);

  const optimizedSrc = generateOptStuffUrl(
    src,
    {
      width: effectiveWidth,
      height: effectiveHeight,
      quality: effectiveQuality,
      format,
      fit,
    },
    expiresIn,
  );

  return (
    <Image
      {...rest}
      src={optimizedSrc}
      width={width}
      height={height}
      alt={alt}
      unoptimized
    />
  );
}
