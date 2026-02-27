import type { ImageLoaderProps } from "next/image";

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
  if (
    src.startsWith("/") ||
    src.startsWith("data:") ||
    src.startsWith("blob:") ||
    src.startsWith("/api/optstuff?")
  ) {
    return src;
  }

  if (!/^https?:\/\//i.test(src)) {
    return src;
  }

  const params = new URLSearchParams({
    url: src,
    w: String(width),
    q: String(quality ?? 80),
    f: "webp",
    fit: "cover",
  });

  return `/api/optstuff?${params}`;
}
