"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type FetchResult =
  | { status: "pending" }
  | { status: "ok"; url: string }
  | { status: "error" };
type FetchState = FetchResult & { key: string };

type SignedImageRequest = {
  readonly src: string;
  readonly width?: number;
  readonly format: "webp" | "avif" | "png" | "jpg";
  readonly quality: number;
};

function isSignedUrlResponse(data: unknown): data is { url: string } {
  return (
    typeof data === "object" &&
    data !== null &&
    "url" in data &&
    typeof data.url === "string"
  );
}

export function useSignedImageUrl({
  src,
  width,
  format,
  quality,
}: SignedImageRequest) {
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
          console.warn("[DynamicImage] Failed to resolve image URL", err);
        }
        if (currentId === requestIdRef.current) {
          setResult({ status: "error", key: requestKey });
        }
      }
    }

    fetchSignedUrl();
    return () => controller.abort();
  }, [src, width, format, quality, requestKey]);

  const markAsError = useCallback(
    () => setResult({ status: "error", key: requestKey }),
    [requestKey],
  );

  return { requestKey, effectiveResult, markAsError };
}
