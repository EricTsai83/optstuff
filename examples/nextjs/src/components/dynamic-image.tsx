"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { useSignedImageUrl } from "../hooks/use-signed-image-url";

type DynamicImageProps = {
  readonly src: string;
  readonly width?: number;
  readonly alt: string;
  readonly format?: "webp" | "avif" | "png" | "jpg";
  readonly quality?: number;
  readonly sizes?: string;
};

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
  sizes,
}: DynamicImageProps) {
  const { requestKey, effectiveResult, markAsError } = useSignedImageUrl({
    src,
    width,
    format,
    quality,
  });
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const imgLoaded = loadedKey === requestKey;

  const handleLoad = useCallback(() => setLoadedKey(requestKey), [requestKey]);
  const handleError = useCallback(() => markAsError(), [markAsError]);

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
        <Image
          src={effectiveResult.url}
          alt={alt}
          fill
          sizes={sizes}
          unoptimized
          onLoad={handleLoad}
          onError={handleError}
          className="object-cover transition-opacity duration-500 ease-out"
          style={{ opacity: imgLoaded ? 1 : 0 }}
        />
      )}
    </>
  );
}
