/**
 * Domain and signature validation utilities for IPX service
 *
 * Security Model:
 * - Signed URLs: All requests must have a valid signature created with the API key's secret
 * - Allowlist-only: Only domains explicitly listed in the API key's allowedSourceDomains are permitted
 * - Production: Empty allowlist = reject all requests (fail closed)
 * - Development: Empty allowlist = allow all (for local testing convenience)
 */

const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Validate if the referer is in the allowed domains list.
 *
 * @param referer - The referer header value
 * @param allowedDomains - List of allowed domains (null or empty = allow all)
 * @returns true if the referer is allowed
 */
export function validateReferer(
  referer: string | null,
  allowedDomains: readonly string[] | null,
) {
  // If no whitelist is set, allow all
  if (!allowedDomains || allowedDomains.length === 0) return true;
  if (!referer) return false;

  try {
    const refererHost = new URL(referer).hostname;
    return allowedDomains.some(
      (domain) => refererHost === domain || refererHost.endsWith(`.${domain}`),
    );
  } catch {
    return false;
  }
}

/**
 * Validate if the source domain is in the allowed domains list.
 *
 * Security: Allowlist-only approach.
 * - Production: Only explicitly allowed domains are permitted. Empty allowlist = reject all.
 * - Development: Empty allowlist = allow all (including localhost) for testing convenience.
 *
 * @param sourceHost - The hostname of the image source
 * @param allowedDomains - List of allowed domains (empty = reject all in production)
 * @returns true if the source domain is allowed
 */
export function validateSourceDomain(
  sourceHost: string,
  allowedDomains: readonly string[] | null,
) {
  // Empty allowlist: reject all in production, allow all in development
  if (!allowedDomains || allowedDomains.length === 0) {
    return isDevelopment;
  }

  // Allowlist-only: domain must match exactly or be a subdomain of an allowed domain
  return allowedDomains.some(
    (domain) => sourceHost === domain || sourceHost.endsWith(`.${domain}`),
  );
}

/**
 * Safely parse a Unix timestamp, returning undefined for invalid values.
 * Only accepts finite positive integers.
 */
function safeParseTimestamp(value: string | null) {
  if (!value) return undefined;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

/**
 * Parse signature parameters from URL search params.
 *
 * @param searchParams - URL search params
 * @returns Parsed signature params or null if missing required params
 */
export function parseSignatureParams(searchParams: URLSearchParams) {
  const keyPrefix = searchParams.get("key");
  const signature = searchParams.get("sig");

  if (!keyPrefix || !signature) {
    return null;
  }

  return {
    keyPrefix,
    signature,
    expiresAt: safeParseTimestamp(searchParams.get("exp")),
  };
}
