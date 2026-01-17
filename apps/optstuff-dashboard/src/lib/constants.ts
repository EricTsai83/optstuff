/**
 * Shared constants across the application
 */

/** Usage limits for the free plan */
export const USAGE_LIMITS = {
  requests: 10000,
  bandwidth: 1024 * 1024 * 1024, // 1GB in bytes
} as const;
