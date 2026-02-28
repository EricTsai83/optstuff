import {
  HOME_HERO_IMAGE,
  HomePageContent,
} from "@/components/home-page-content";
import { HERO_BLUR_CONFIG, HERO_BLUR_MODE } from "@/lib/hero-blur-config";
import type { BlurDataResult } from "@/lib/optstuff";
import { generateOptStuffUrl, getBlurDataResult } from "@/lib/optstuff";
import { cacheLife, unstable_noStore as noStore } from "next/cache";
import { Suspense } from "react";

const HERO_URL_TTL_SECONDS = 7200;
const HERO_FORCE_REFRESH_URL_TTL_SECONDS = 1;
type HomeSearchParams = Record<string, string | string[] | undefined>;
type HomePageProps = {
  searchParams: Promise<HomeSearchParams>;
};

const HERO_CACHE_OPTIONS = {
  format: "webp" as const,
  quality: 85,
  width: 1600,
  fit: "cover" as const,
};

const HERO_BLUR_OPTIONS = {
  width: 32,
  quality: 20,
  format: "webp" as const,
  fit: "cover" as const,
};

/**
 * Get the cached signed hero URL.
 *
 * This function is cached for 1 hour.
 *
 * @returns The cached signed hero URL.
 * @see https://nextjs.org/docs/app/api-reference/directives/use-cache
 */
async function getCachedHeroImageUrl() {
  "use cache";
  cacheLife("hours");
  return generateOptStuffUrl(
    HOME_HERO_IMAGE,
    HERO_CACHE_OPTIONS,
    HERO_URL_TTL_SECONDS,
  );
}

/**
 * Get a freshly signed hero URL for forced refresh.
 *
 * Uses a very short exp window so each reload gets a new URL,
 * which helps force a new sharp image request.
 */
function getForceRefreshHeroImageUrl() {
  return generateOptStuffUrl(
    HOME_HERO_IMAGE,
    HERO_CACHE_OPTIONS,
    HERO_FORCE_REFRESH_URL_TTL_SECONDS,
  );
}

/**
 * Get the build-cache blur result for the hero image.
 */
async function getBuildCacheHeroBlurResult(bypassCache: boolean) {
  return getBlurDataResult(HOME_HERO_IMAGE, HERO_BLUR_OPTIONS, {
    mode: HERO_BLUR_MODE.BUILD_CACHE,
    bypassCache,
  });
}

/**
 * Get a realtime blur result for the hero image.
 */
async function getRealtimeHeroBlurResult() {
  return getBlurDataResult(HOME_HERO_IMAGE, HERO_BLUR_OPTIONS, {
    mode: HERO_BLUR_MODE.REALTIME,
  });
}

function resolveHeroBlurDebugReason(
  blurResult: BlurDataResult,
): string | undefined {
  if (blurResult.status === "ok") {
    return undefined;
  }

  switch (blurResult.reason) {
    case "status":
      return blurResult.statusCode
        ? `status-${blurResult.statusCode}`
        : "status";
    case "non-image":
      return blurResult.contentType
        ? `non-image:${blurResult.contentType}`
        : "non-image";
    default:
      return blurResult.reason;
  }
}

function resolveHeroBlurStatusCode(
  blurResult: BlurDataResult,
): string | undefined {
  if (blurResult.status === "ok") {
    return undefined;
  }

  if (blurResult.statusCode === undefined) {
    return undefined;
  }

  return String(blurResult.statusCode);
}

function resolveHeroBlurContentType(
  blurResult: BlurDataResult,
): string | undefined {
  if (blurResult.status === "ok") {
    return undefined;
  }

  return blurResult.contentType;
}

function resolveHeroBlurDurationMs(
  blurResult: BlurDataResult,
): string | undefined {
  if (blurResult.durationMs === undefined) {
    return undefined;
  }

  return `${blurResult.durationMs}ms`;
}

function resolveBooleanSearchParam(
  value: string | string[] | undefined,
): boolean {
  const normalized = Array.isArray(value) ? value[0] : value;
  if (!normalized) {
    return false;
  }

  const lowered = normalized.toLowerCase();
  return lowered === "1" || lowered === "true" || lowered === "yes";
}

async function HomeResolved({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams;
  const heroBlurMode = HERO_BLUR_CONFIG.mode;
  const heroForceRefresh =
    process.env.NODE_ENV !== "production" &&
    (resolveBooleanSearchParam(resolvedSearchParams["hero-refresh"]) ||
      resolveBooleanSearchParam(resolvedSearchParams["blur-bust"]));

  if (heroBlurMode === HERO_BLUR_MODE.REALTIME) {
    noStore();
  }

  const heroImageUrlPromise = heroForceRefresh
    ? getForceRefreshHeroImageUrl()
    : getCachedHeroImageUrl();
  const heroBlurResultPromise =
    heroBlurMode === HERO_BLUR_MODE.REALTIME
      ? getRealtimeHeroBlurResult()
      : getBuildCacheHeroBlurResult(heroForceRefresh);
  const [heroImageUrl, heroBlurResult] = await Promise.all([
    heroImageUrlPromise,
    heroBlurResultPromise,
  ]);
  const heroBlurDataUrl =
    heroBlurResult.status === "ok" ? heroBlurResult.dataUrl : undefined;
  const heroBlurStatus =
    heroBlurResult.status === "ok" ? "available" : "missing";
  const heroBlurSource = heroBlurResult.source;
  const heroBlurNetworkRequested = heroBlurSource === "network" ? "yes" : "no";
  const heroForceRefreshStatus = heroForceRefresh ? "yes" : "no";
  const heroBlurDebugReason = resolveHeroBlurDebugReason(heroBlurResult);
  const heroBlurDebugStatusCode = resolveHeroBlurStatusCode(heroBlurResult);
  const heroBlurDebugContentType = resolveHeroBlurContentType(heroBlurResult);
  const heroBlurDebugDuration = resolveHeroBlurDurationMs(heroBlurResult);

  return (
    <HomePageContent
      heroImageUrl={heroImageUrl}
      heroBlurDataUrl={heroBlurDataUrl}
      heroBlurMode={heroBlurMode}
      heroBlurStatus={heroBlurStatus}
      heroBlurSource={heroBlurSource}
      heroBlurNetworkRequested={heroBlurNetworkRequested}
      heroForceRefresh={heroForceRefreshStatus}
      heroBlurReason={heroBlurDebugReason}
      heroBlurStatusCode={heroBlurDebugStatusCode}
      heroBlurContentType={heroBlurDebugContentType}
      heroBlurDuration={heroBlurDebugDuration}
      showHeroDebugInfo={process.env.NODE_ENV !== "production"}
    />
  );
}

function HomeFallback() {
  return <div className="bg-background min-h-screen" />;
}

export default function Home({ searchParams }: HomePageProps) {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeResolved searchParams={searchParams} />
    </Suspense>
  );
}
