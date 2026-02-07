import { Redis } from "@upstash/redis";

/**
 * Shared Redis client singleton (lazy initialization).
 * Used across rate limiter, project cache, and usage tracker.
 *
 * Uses `Redis.fromEnv()` which reads `UPSTASH_REDIS_REST_URL`
 * and `UPSTASH_REDIS_REST_TOKEN` from environment variables.
 */
let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = Redis.fromEnv();
  }
  return redis;
}
