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
  quickstart: `${env.NEXT_PUBLIC_DOCS_URL}/getting-started/quickstart`,
  integration: `${env.NEXT_PUBLIC_DOCS_URL}/getting-started/integration-guide`,
  keyManagement: `${env.NEXT_PUBLIC_DOCS_URL}/guides/key-management`,
  security: `${env.NEXT_PUBLIC_DOCS_URL}/guides/security-best-practices`,
  urlSigning: `${env.NEXT_PUBLIC_DOCS_URL}/guides/url-signing`,
  codeExamples: `${env.NEXT_PUBLIC_DOCS_URL}/guides/code-examples`,
  cdnCaching: `${env.NEXT_PUBLIC_DOCS_URL}/guides/cdn-caching`,
  pricing: `${env.NEXT_PUBLIC_DOCS_URL}/introduction/pricing-and-limits`,
  faq: `${env.NEXT_PUBLIC_DOCS_URL}/faq`,
  changelog: `${env.NEXT_PUBLIC_DOCS_URL}/changelog`,
} as const;
