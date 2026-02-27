import type { ImageLoaderProps } from "next/image";

type ImageFormat = "webp" | "avif" | "png" | "jpg";
type ImageFit = "cover" | "contain" | "fill";

type OptStuffProxyParams = {
  src: string;
  width: number;
  quality?: number;
  format?: ImageFormat;
  fit?: ImageFit;
};

const DEFAULT_QUALITY = 80;
const DEFAULT_FORMAT: ImageFormat = "webp";
const DEFAULT_FIT: ImageFit = "cover";

function shouldBypassProxy(src: string) {
  return (
    src.startsWith("/") ||
    src.startsWith("data:") ||
    src.startsWith("blob:") ||
    src.startsWith("/api/optstuff?") ||
    !/^https?:\/\//i.test(src)
  );
}

export function buildOptStuffProxyPath({
  src,
  width,
  quality = DEFAULT_QUALITY,
  format = DEFAULT_FORMAT,
  fit = DEFAULT_FIT,
}: OptStuffProxyParams) {
  if (shouldBypassProxy(src)) {
    return src;
  }

  const params = new URLSearchParams({
    url: src,
    w: String(width),
    q: String(quality),
    f: format,
    fit,
  });

  return `/api/optstuff?${params}`;
}

/**
 * Global OptStuff loader for next/image.
 *
 * - Remote HTTP(S) images are routed through `/api/optstuff`, which signs URLs
 *   server-side before redirecting to the optimized asset.
 * - Local assets (`/...`), data URLs, and already-routed OptStuff URLs are
 *   passed through untouched.
 *
 * Components can still provide a per-image `loader` to override defaults
 * (e.g. custom format/fit behavior in `OptStuffImage`).
 */
export default function nextImageOptStuffLoader({
  src,
  width,
  quality,
}: ImageLoaderProps) {
  return buildOptStuffProxyPath({ src, width, quality });
}
