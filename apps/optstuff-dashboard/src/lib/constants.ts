/**
 * Shared constants across the application
 */

import { env } from "@/env";

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

/** Centralized documentation links — driven by `NEXT_PUBLIC_DOCS_URL` env var */
export const DOCS_LINKS = {
  home: env.NEXT_PUBLIC_DOCS_URL,
  gettingStarted: `${env.NEXT_PUBLIC_DOCS_URL}/getting-started`,
  integration: `${env.NEXT_PUBLIC_DOCS_URL}/integration`,
  apiKeys: `${env.NEXT_PUBLIC_DOCS_URL}/api-keys`,
  security: `${env.NEXT_PUBLIC_DOCS_URL}/security`,
  urlSigning: `${env.NEXT_PUBLIC_DOCS_URL}/url-signing`,
} as const;
