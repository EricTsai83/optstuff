/**
 * Redis-based rate limiter using Upstash Ratelimit SDK.
 *
 * Uses sliding window algorithm to avoid burst-at-boundary issues.
 * Supports per-API-key dynamic limits.
 * Includes built-in analytics via Upstash dashboard.
 */

import { Ratelimit } from "@upstash/ratelimit";

import { getRedis } from "@/server/lib/redis";

const MINUTE_PREFIX = "ratelimit:ipx:minute";
const DAY_PREFIX = "ratelimit:ipx:day";
const PRE_AUTH_PREFIX = "ratelimit:ipx:pre-auth";
const PRE_AUTH_LIMIT_PER_MINUTE = 600;
const minuteLimiterCache = new Map<number, Ratelimit>();
const dayLimiterCache = new Map<number, Ratelimit>();
let preAuthLimiter: Ratelimit | undefined;

/**
 * Rate limit check result
 */
export type RateLimitResult =
  | { readonly allowed: true; readonly remaining: number }
  | {
      readonly allowed: false;
      readonly reason: "minute" | "day" | "unavailable";
      readonly retryAfterSeconds: number;
      readonly limit: number;
      readonly remaining: number;
    };

/**
 * Rate limit configuration for an API key
 */
export type RateLimitConfig = {
  readonly publicKey: string;
  readonly limitPerMinute: number;
  readonly limitPerDay: number;
};

function createMinuteLimiter(limit: number): Ratelimit {
  const cached = minuteLimiterCache.get(limit);
  if (cached) return cached;

  const limiter = new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(limit, "1m"),
    analytics: true,
    prefix: MINUTE_PREFIX,
  });
  minuteLimiterCache.set(limit, limiter);
  return limiter;
}

function createDayLimiter(limit: number): Ratelimit {
  const cached = dayLimiterCache.get(limit);
  if (cached) return cached;

  const limiter = new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(limit, "1d"),
    analytics: true,
    prefix: DAY_PREFIX,
  });
  dayLimiterCache.set(limit, limiter);
  return limiter;
}

function createPreAuthLimiter(): Ratelimit {
  preAuthLimiter ??= new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(PRE_AUTH_LIMIT_PER_MINUTE, "1m"),
    analytics: true,
    prefix: PRE_AUTH_PREFIX,
  });
  return preAuthLimiter;
}

function unavailableResult(): RateLimitResult {
  return {
    allowed: false,
    reason: "unavailable",
    retryAfterSeconds: 30,
    limit: 0,
    remaining: 0,
  };
}

/**
 * Check if a request is allowed under the rate limit.
 * Uses sliding window algorithm via @upstash/ratelimit.
 *
 * Checks per-minute limit first so minute-limited bursts do not burn daily
 * quota. Redis failures fail closed because this protects expensive image
 * processing and quota integrity.
 */
export async function checkRateLimit(
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  try {
    const minuteResult = await createMinuteLimiter(config.limitPerMinute).limit(
      config.publicKey,
    );

    if (!minuteResult.success) {
      return {
        allowed: false,
        reason: "minute",
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((minuteResult.reset - Date.now()) / 1000),
        ),
        limit: config.limitPerMinute,
        remaining: minuteResult.remaining,
      };
    }

    const dayResult = await createDayLimiter(config.limitPerDay).limit(
      config.publicKey,
    );

    if (!dayResult.success) {
      return {
        allowed: false,
        reason: "day",
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((dayResult.reset - Date.now()) / 1000),
        ),
        limit: config.limitPerDay,
        remaining: dayResult.remaining,
      };
    }

    // Both limits passed
    return {
      allowed: true,
      remaining: Math.min(minuteResult.remaining, dayResult.remaining),
    };
  } catch (error) {
    console.error("Rate limiter Redis error, failing closed:", error);
    return unavailableResult();
  }
}

export async function checkPreAuthRateLimit(
  identifier: string,
): Promise<RateLimitResult> {
  try {
    const result = await createPreAuthLimiter().limit(identifier);
    if (!result.success) {
      return {
        allowed: false,
        reason: "minute",
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((result.reset - Date.now()) / 1000),
        ),
        limit: PRE_AUTH_LIMIT_PER_MINUTE,
        remaining: result.remaining,
      };
    }

    return {
      allowed: true,
      remaining: result.remaining,
    };
  } catch (error) {
    console.error("Pre-auth rate limiter Redis error, failing closed:", error);
    return unavailableResult();
  }
}

/**
 * Reset rate limit counters for a specific API key.
 * Useful for testing or administrative purposes.
 */
export async function resetRateLimit(publicKey: string): Promise<void> {
  await Promise.all([
    createMinuteLimiter(1).resetUsedTokens(publicKey),
    createDayLimiter(1).resetUsedTokens(publicKey),
  ]);
}
