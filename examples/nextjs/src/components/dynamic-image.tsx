"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type DynamicImageProps = {
  readonly src: string;
  readonly width?: number;
  readonly alt: string;
  readonly format?: "webp" | "avif" | "png" | "jpg";
  readonly quality?: number;
};

type FetchResult =
  | { status: "pending" }
  | { status: "ok"; url: string }
  | { status: "error" };

/**
 * Fetches a signed URL from the OptStuff POST API and renders the resulting
 * image with a loading placeholder and fade-in transition.
 *
 * Demonstrates Option 2 (API Route + Client) from the docs.
 */
export function DynamicImage({
  src,
  width,
  alt,
  format = "webp",
  quality = 80,
}: DynamicImageProps) {
  const requestKey = useMemo(
    () => `${src}|${width}|${format}|${quality}`,
    [src, width, format, quality],
  );

  const [result, setResult] = useState<FetchResult & { key: string }>({
    status: "pending",
    key: requestKey,
  });
  const [imgLoaded, setImgLoaded] = useState(false);
  const requestIdRef = useRef(0);

  const stale = result.key !== requestKey;
  const effectiveResult: FetchResult = stale
    ? { status: "pending" }
    : result;

  useEffect(() => {
    const currentId = ++requestIdRef.current;
    const controller = new AbortController();

    async function fetchSignedUrl() {
      try {
        const res = await fetch("/api/optstuff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: src, width, format, quality }),
          signal: controller.signal,
        });

        if (currentId !== requestIdRef.current) return;

        if (!res.ok) {
          setResult({ status: "error", key: requestKey });
          return;
        }

        const data = (await res.json()) as { url: string };

        if (currentId === requestIdRef.current) {
          setResult({ status: "ok", url: data.url, key: requestKey });
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        if (currentId === requestIdRef.current) {
          setResult({ status: "error", key: requestKey });
        }
      }
    }

    fetchSignedUrl();
    return () => controller.abort();
  }, [src, width, format, quality, requestKey]);

  const handleLoad = useCallback(() => setImgLoaded(true), []);
  const handleError = useCallback(
    () => setResult((prev) => ({ ...prev, status: "error" })),
    [],
  );

  if (effectiveResult.status === "error") {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-100 dark:bg-zinc-800">
        <span className="text-muted text-xs font-medium">
          Failed to load image
        </span>
      </div>
    );
  }

  const showPlaceholder =
    effectiveResult.status === "pending" ||
    (effectiveResult.status === "ok" && !imgLoaded);

  return (
    <>
      {showPlaceholder && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
          <div className="size-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-500 dark:border-zinc-600 dark:border-t-zinc-400" />
        </div>
      )}
      {effectiveResult.status === "ok" && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={effectiveResult.url}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className="h-full w-full object-cover transition-opacity duration-500 ease-out"
          style={{ opacity: imgLoaded ? 1 : 0 }}
        />
      )}
    </>
  );
}
