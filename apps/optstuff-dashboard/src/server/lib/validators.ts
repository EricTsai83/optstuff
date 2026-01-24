/**
 * Domain validation utilities for IPX service
 */

/**
 * Validate if the referer is in the allowed domains list
 *
 * @param referer - The referer header value
 * @param allowedDomains - List of allowed domains (null or empty = allow all)
 * @returns true if the referer is allowed
 */
export function validateReferer(
  referer: string | null,
  allowedDomains: string[] | null,
): boolean {
  // If no whitelist is set, allow all
  if (!allowedDomains || allowedDomains.length === 0) return true;
  if (!referer) return false;

  try {
    const refererHost = new URL(referer).hostname;
    return allowedDomains.some(
      (domain) =>
        refererHost === domain || refererHost.endsWith(`.${domain}`),
    );
  } catch {
    return false;
  }
}

/**
 * Validate if the source domain is in the allowed domains list
 *
 * @param sourceHost - The hostname of the image source
 * @param allowedDomains - List of allowed domains (null or empty = allow all)
 * @returns true if the source domain is allowed
 */
export function validateSourceDomain(
  sourceHost: string,
  allowedDomains: string[] | null,
): boolean {
  // If no whitelist is set, allow all
  if (!allowedDomains || allowedDomains.length === 0) return true;

  return allowedDomains.some(
    (domain) => sourceHost === domain || sourceHost.endsWith(`.${domain}`),
  );
}
