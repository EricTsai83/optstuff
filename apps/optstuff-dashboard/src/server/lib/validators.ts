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
 * Validate if the referer is in the allowed origins list.
 *
 * Each allowed entry must include a protocol, e.g. "https://example.com" or
 * "http://localhost". The referer's protocol and hostname are both checked.
 * Wildcard prefixes ("https://*.example.com") match any subdomain.
 *
 * Legacy entries without a protocol are treated as hostname-only and matched
 * against any protocol for backwards compatibility.
 *
 * @param referer - The referer header value
 * @param allowedDomains - List of allowed origins (null or empty = allow all)
 * @returns true if the referer is allowed
 */
export function validateReferer(
  referer: string | null,
  allowedDomains: readonly string[] | null,
) {
  if (!allowedDomains || allowedDomains.length === 0) return true;
  if (!referer) return false;

  try {
    const refererUrl = new URL(referer);
    const refererProtocol = refererUrl.protocol; // "http:" or "https:"
    const refererHost = refererUrl.hostname;

    return allowedDomains.some((entry) => {
      const protoMatch = entry.match(/^(https?):\/\//);

      if (protoMatch) {
        const allowedProtocol = `${protoMatch[1]}:`;
        if (refererProtocol !== allowedProtocol) return false;

        const hostPart = entry.slice(protoMatch[0].length);
        if (hostPart.startsWith("*.")) {
          const base = hostPart.slice(2);
          return refererHost === base || refererHost.endsWith(`.${base}`);
        }
        return refererHost === hostPart;
      }

      // Legacy: bare hostname without protocol — match any protocol
      if (entry.startsWith("*.")) {
        const base = entry.slice(2);
        return refererHost === base || refererHost.endsWith(`.${base}`);
      }
      return refererHost === entry;
    });
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
  const publicKey = searchParams.get("key");
  const signature = searchParams.get("sig");

  if (!publicKey || !signature) {
    return null;
  }

  return {
    publicKey,
    signature,
    expiresAt: safeParseTimestamp(searchParams.get("exp")),
  };
}
