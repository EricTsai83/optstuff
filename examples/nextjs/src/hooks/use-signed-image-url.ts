"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type FetchResult =
  | { status: "pending" }
  | { status: "ok"; url: string }
  | { status: "error" };
type FetchState = FetchResult & { key: string };

/**
 * Input payload used to request a signed image URL.
 */
type SignedImageRequest = {
  readonly src: string;
  readonly width?: number;
  readonly format: "webp" | "avif" | "png" | "jpg";
  readonly quality: number;
};

type UseSignedImageUrlResult = {
  readonly requestKey: string;
  readonly effectiveResult: FetchResult;
  readonly markAsError: () => void;
};

function isSignedUrlResponse(data: unknown): data is { url: string } {
  return (
    typeof data === "object" &&
    data !== null &&
    "url" in data &&
    typeof data.url === "string"
  );
}

/**
 * Fetches a short-lived signed image URL for the provided source.
 *
 * This hook keeps the UI stable while request inputs change by returning a
 * `"pending"` state for stale responses, and it prevents race conditions by
 * discarding outdated requests.
 *
 * @param params - Options that describe the desired transformed image.
 * @param params.src - Original image URL to sign.
 * @param params.width - Optional resize width in pixels.
 * @param params.format - Output image format.
 * @param params.quality - Output image quality value used by the image API.
 * @returns A stable key for the current request, the current fetch result, and
 * a helper to manually mark the current request as failed (for example when an
 * `<img>` load event errors).
 */
export function useSignedImageUrl({
  src,
  width,
  format,
  quality,
}: SignedImageRequest): UseSignedImageUrlResult {
  const requestKey = useMemo(
    () => `${src}|${width}|${format}|${quality}`,
    [src, width, format, quality],
  );
  const [result, setResult] = useState<FetchState>({
    status: "pending",
    key: requestKey,
  });
  const requestIdRef = useRef(0);

  const stale = result.key !== requestKey;
  const effectiveResult: FetchResult = stale ? { status: "pending" } : result;

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
          throw new Error(`Failed to fetch image URL: ${res.status}`);
        }

        const data: unknown = await res.json();

        if (!isSignedUrlResponse(data)) {
          throw new Error("Invalid image response: expected { url: string }");
        }

        if (currentId === requestIdRef.current) {
          setResult({ status: "ok", url: data.url, key: requestKey });
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        if (process.env.NODE_ENV === "development") {
          console.warn("[useSignedImageUrl] Failed to resolve image URL", err);
        }
        if (currentId === requestIdRef.current) {
          setResult({ status: "error", key: requestKey });
        }
      }
    }

    fetchSignedUrl();
    return () => controller.abort();
  }, [src, width, format, quality, requestKey]);

  const markAsError = useCallback(() => {
    if (effectiveResult.status === "error") return;

    setResult((prev) => {
      if (prev.key !== requestKey || prev.status === "error") {
        return prev;
      }

      return { status: "error", key: requestKey };
    });
  }, [effectiveResult.status, requestKey, setResult]);

  return { requestKey, effectiveResult, markAsError };
}
