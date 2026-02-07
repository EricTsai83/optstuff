/**
 * Shared constants across the application
 */

/** Usage limits for the free plan */
export const USAGE_LIMITS = {
  requests: 10000,
  bandwidth: 1024 * 1024 * 1024, // 1GB in bytes
} as const;

/** Default rate limits applied to all API keys */
export const RATE_LIMITS = {
  perMinute: 60,
  perDay: 10000,
} as const;
