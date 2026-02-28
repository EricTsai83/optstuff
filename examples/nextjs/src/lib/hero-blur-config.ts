export const HERO_BLUR_MODE = {
  BUILD_CACHE: "build-cache",
  REALTIME: "realtime",
} as const;

export type HeroBlurMode = (typeof HERO_BLUR_MODE)[keyof typeof HERO_BLUR_MODE];

type HeroBlurConfig = {
  readonly mode: HeroBlurMode;
  readonly fetchTimeoutMs: number;
  readonly successCacheMs: number;
  readonly missCacheMs: number;
};

/**
 * Centralized hero blur behavior for the demo app.
 *
 * Update this file to switch blur mode or tune cache/timeout behavior.
 */
export const HERO_BLUR_CONFIG: HeroBlurConfig = {
  mode: HERO_BLUR_MODE.BUILD_CACHE,
  fetchTimeoutMs: 6000,
  successCacheMs: 60 * 60 * 1000,
  missCacheMs: 10 * 1000,
};
