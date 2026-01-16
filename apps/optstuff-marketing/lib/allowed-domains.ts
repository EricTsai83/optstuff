/**
 * Domain whitelist configuration
 *
 * To prevent SSRF attacks, only allow loading images from whitelisted domains
 */

/** Production allowed domains */
const PRODUCTION_DOMAINS = [
  "optstuff.vercel.app",
  "optstuff.com",
  "www.optstuff.com",
];

/** Development-only allowed domains */
const DEV_ONLY_DOMAINS = ["localhost", "127.0.0.1"];

/**
 * Get allowed image source domains for IPX
 */
export function getIpxAllowedDomains(): string[] {
  if (process.env.NODE_ENV !== "production") {
    return [...PRODUCTION_DOMAINS, ...DEV_ONLY_DOMAINS];
  }
  return PRODUCTION_DOMAINS;
}

/**
 * Get allowed request origin domains for Proxy middleware
 */
export function getProxyAllowedDomains(): string[] {
  const envDomains = process.env.ALLOWED_DOMAINS;
  if (envDomains) {
    return envDomains.split(",").map((d) => d.trim());
  }
  if (process.env.NODE_ENV !== "production") {
    return [...PRODUCTION_DOMAINS, ...DEV_ONLY_DOMAINS];
  }
  return PRODUCTION_DOMAINS;
}

/**
 * Check if domain is in the allowed list
 */
export function isDomainAllowed(
  url: string | null,
  allowedDomains: string[],
): boolean {
  if (!url) return false;

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;

    return allowedDomains.some((domain) => {
      return hostname === domain || hostname.endsWith(`.${domain}`);
    });
  } catch {
    return false;
  }
}
