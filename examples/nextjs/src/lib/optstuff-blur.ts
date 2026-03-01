import "server-only";

import { HERO_BLUR_CONFIG } from "./hero-blur-config";
import { generateOptStuffUrl } from "./optstuff-core";
import type { ImageOperation } from "./optstuff-core";

const BLUR_DATA_REVALIDATE_SECONDS = 3600;
const BLUR_DATA_FETCH_TIMEOUT_MS = HERO_BLUR_CONFIG.fetchTimeoutMs;
const BLUR_SUCCESS_CACHE_MS = HERO_BLUR_CONFIG.successCacheMs;
const BLUR_MISS_CACHE_MS = HERO_BLUR_CONFIG.missCacheMs;

type BlurDataFetchMode = "build-cache" | "realtime";

type BlurDataFetchOptions = {
  mode?: BlurDataFetchMode;
  bypassCache?: boolean;
};

type BlurMissReason = "timeout" | "network" | "status" | "non-image";

export type BlurDataResult =
  | {
      status: "ok";
      dataUrl: string;
      source: "network" | "success-cache";
      durationMs: number | undefined;
    }
  | {
      status: "miss";
      reason: BlurMissReason;
      source: "network" | "miss-cache";
      statusCode: number | undefined;
      contentType: string | undefined;
      durationMs: number | undefined;
    };

type BlurSuccessCacheEntry = {
  dataUrl: string;
};

type BlurMissCacheEntry = {
  reason: BlurMissReason;
  statusCode: number | undefined;
  contentType: string | undefined;
};

const blurSuccessCache = new Map<string, BlurSuccessCacheEntry>();
const blurMissCache = new Map<string, BlurMissCacheEntry>();
const blurInFlight = new Map<string, Promise<BlurDataResult>>();
const blurSuccessCacheTimers = new Map<string, ReturnType<typeof setTimeout>>();
const blurMissCacheTimers = new Map<string, ReturnType<typeof setTimeout>>();

function buildBlurCacheKey(
  imageUrl: string,
  {
    width,
    quality,
    format,
    fit,
  }: {
    width: number;
    quality: number;
    format: NonNullable<ImageOperation["format"]>;
    fit: NonNullable<ImageOperation["fit"]>;
  },
): string {
  return `${imageUrl}|w=${width}|q=${quality}|f=${format}|fit=${fit}`;
}

function readSuccessCache(key: string): BlurSuccessCacheEntry | undefined {
  return blurSuccessCache.get(key);
}

function readMissCache(key: string): BlurMissCacheEntry | undefined {
  return blurMissCache.get(key);
}

function setSuccessCache(key: string, dataUrl: string) {
  const existingTimeout = blurSuccessCacheTimers.get(key);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  blurSuccessCache.set(key, { dataUrl });
  const timeout = setTimeout(() => {
    blurSuccessCache.delete(key);
    blurSuccessCacheTimers.delete(key);
  }, BLUR_SUCCESS_CACHE_MS);
  timeout.unref?.();
  blurSuccessCacheTimers.set(key, timeout);
}

function setMissCache(
  key: string,
  {
    reason,
    statusCode,
    contentType,
  }: {
    reason: BlurMissReason;
    statusCode: number | undefined;
    contentType: string | undefined;
  },
) {
  const existingTimeout = blurMissCacheTimers.get(key);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  blurMissCache.set(key, {
    reason,
    statusCode,
    contentType,
  });
  const timeout = setTimeout(() => {
    blurMissCache.delete(key);
    blurMissCacheTimers.delete(key);
  }, BLUR_MISS_CACHE_MS);
  timeout.unref?.();
  blurMissCacheTimers.set(key, timeout);
}

/**
 * Resolve blur data URL with positive/negative cache separation.
 *
 * In `build-cache` mode, successful blur results are cached longer than misses
 * so transient failures do not poison the cache.
 */
export async function getBlurDataResult(
  imageUrl: string,
  {
    width = 32,
    quality = 20,
    format = "webp",
    fit = "cover",
  }: Partial<ImageOperation> = {},
  { mode = "build-cache", bypassCache = false }: BlurDataFetchOptions = {},
): Promise<BlurDataResult> {
  const resolvedFormat = format;
  const resolvedFit = fit;
  const cacheKey = buildBlurCacheKey(imageUrl, {
    width,
    quality,
    format: resolvedFormat,
    fit: resolvedFit,
  });

  if (mode === "build-cache" && !bypassCache) {
    const successEntry = readSuccessCache(cacheKey);
    if (successEntry) {
      return {
        status: "ok",
        dataUrl: successEntry.dataUrl,
        source: "success-cache",
        durationMs: undefined,
      };
    }

    const missEntry = readMissCache(cacheKey);
    if (missEntry) {
      return {
        status: "miss",
        reason: missEntry.reason,
        source: "miss-cache",
        statusCode: missEntry.statusCode,
        contentType: missEntry.contentType,
        durationMs: undefined,
      };
    }

    const inFlight = blurInFlight.get(cacheKey);
    if (inFlight) {
      return inFlight;
    }
  }

  const url = generateOptStuffUrl(
    imageUrl,
    { width, quality, format: resolvedFormat, fit: resolvedFit },
    undefined,
  );

  const executeFetch = async (): Promise<BlurDataResult> => {
    const startTimeMs = performance.now();
    const controller = new AbortController();
    let isTimedOut = false;
    const timeoutId = setTimeout(() => {
      isTimedOut = true;
      controller.abort();
    }, BLUR_DATA_FETCH_TIMEOUT_MS);

    const requestInit =
      mode === "realtime"
        ? ({
            cache: "no-store",
            signal: controller.signal,
          } as const)
        : ({
            cache: "force-cache",
            next: { revalidate: BLUR_DATA_REVALIDATE_SECONDS },
            signal: controller.signal,
          } as const);

    try {
      const res = await fetch(url, requestInit);
      const durationMs = Math.round(performance.now() - startTimeMs);
      const contentType = res.headers.get("content-type") ?? `image/${resolvedFormat}`;
      if (!res.ok) {
        return {
          status: "miss",
          reason: "status",
          source: "network",
          statusCode: res.status,
          contentType: undefined,
          durationMs,
        };
      }

      if (!contentType.toLowerCase().startsWith("image/")) {
        return {
          status: "miss",
          reason: "non-image",
          source: "network",
          statusCode: res.status,
          contentType,
          durationMs,
        };
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      return {
        status: "ok",
        dataUrl: `data:${contentType};base64,${buffer.toString("base64")}`,
        source: "network",
        durationMs,
      };
    } catch {
      return {
        status: "miss",
        reason: isTimedOut ? "timeout" : "network",
        source: "network",
        statusCode: undefined,
        contentType: undefined,
        durationMs: Math.round(performance.now() - startTimeMs),
      };
    } finally {
      clearTimeout(timeoutId);
    }
  };

  if (mode === "realtime") {
    return executeFetch();
  }

  const networkRequest = executeFetch().then((result) => {
    if (result.status === "ok") {
      setSuccessCache(cacheKey, result.dataUrl);
      blurMissCache.delete(cacheKey);
      const missTimeout = blurMissCacheTimers.get(cacheKey);
      if (missTimeout) {
        clearTimeout(missTimeout);
        blurMissCacheTimers.delete(cacheKey);
      }
      return result;
    }

    setMissCache(cacheKey, {
      reason: result.reason,
      statusCode: result.statusCode,
      contentType: result.contentType,
    });
    return result;
  });

  blurInFlight.set(cacheKey, networkRequest);
  try {
    return await networkRequest;
  } finally {
    blurInFlight.delete(cacheKey);
  }
}

export async function getBlurDataUrl(
  imageUrl: string,
  operations: Partial<ImageOperation> = {},
  options: BlurDataFetchOptions = {},
): Promise<string | undefined> {
  const result = await getBlurDataResult(imageUrl, operations, options);
  if (result.status === "ok") {
    return result.dataUrl;
  }
  return undefined;
}
