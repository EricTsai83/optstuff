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

/**
 * Rate limit check result
 */
export type RateLimitResult =
  | { readonly allowed: true; readonly remaining: number }
  | {
      readonly allowed: false;
      readonly reason: "minute" | "day";
      readonly retryAfterSeconds: number;
      readonly limit: number;
      readonly remaining: number;
    };

/**
 * Rate limit configuration for an API key
 */
export type RateLimitConfig = {
  readonly keyPrefix: string;
  readonly limitPerMinute: number;
  readonly limitPerDay: number;
};

function createMinuteLimiter(limit: number): Ratelimit {
  return new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(limit, "1m"),
    analytics: true,
    prefix: MINUTE_PREFIX,
  });
}

function createDayLimiter(limit: number): Ratelimit {
  return new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(limit, "1d"),
    analytics: true,
    prefix: DAY_PREFIX,
  });
}

/**
 * Check if a request is allowed under the rate limit.
 * Uses sliding window algorithm via @upstash/ratelimit.
 *
 * Checks per-day limit first (wider window), then per-minute limit.
 *
 * The day limit is checked first to avoid wasting minute-window tokens
 * when the day limit is already exhausted. Since `.limit()` is a
 * consume-and-check operation, checking minute first would decrement
 * the minute counter even when the day limit would reject the request.
 * Checking day first minimises this: a wasted day token (when minute
 * subsequently rejects) is negligible relative to a 10,000-token pool.
 *
 * Degrades gracefully when Redis is unreachable — fails open (allows the
 * request) rather than returning a 500, since rate limiting is a protective
 * layer, not a core dependency. A warning is logged so operators can detect
 * prolonged Redis outages.
 */
export async function checkRateLimit(
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  try {
    // Check per-day limit first (wider window — avoids wasting minute tokens)
    const dayResult = await createDayLimiter(config.limitPerDay).limit(
      config.keyPrefix,
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

    // Check per-minute limit (stricter, more immediate feedback)
    const minuteResult = await createMinuteLimiter(config.limitPerMinute).limit(
      config.keyPrefix,
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

    // Both limits passed
    return {
      allowed: true,
      remaining: Math.min(minuteResult.remaining, dayResult.remaining),
    };
  } catch (error) {
    // Fail-open: allow the request through when Redis is unreachable.
    // Rate limiting is a protective layer — a brief outage should not
    // cause all image requests to fail with 500.
    console.warn("Rate limiter Redis error, failing open:", error);
    return {
      allowed: true,
      remaining: 0,
    };
  }
}

/**
 * Reset rate limit counters for a specific API key.
 * Useful for testing or administrative purposes.
 */
export async function resetRateLimit(keyPrefix: string): Promise<void> {
  await Promise.all([
    createMinuteLimiter(1).resetUsedTokens(keyPrefix),
    createDayLimiter(1).resetUsedTokens(keyPrefix),
  ]);
}
