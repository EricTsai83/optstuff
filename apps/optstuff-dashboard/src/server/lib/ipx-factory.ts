import { createIPX, ipxFSStorage, ipxHttpStorage } from "ipx";
import path from "path";

/**
 * IPX instance cache - keyed by sorted domain list
 * This avoids creating new IPX instances for every request
 */
const ipxInstances = new Map<string, ReturnType<typeof createIPX>>();

/**
 * Get or create an IPX instance for a set of allowed domains
 *
 * @param allowedDomains - List of allowed source domains
 * @returns IPX instance configured for the given domains
 */
export function getProjectIPX(allowedDomains: string[] | null) {
  // If no domains specified, use a wildcard instance
  const domains =
    allowedDomains && allowedDomains.length > 0 ? allowedDomains : ["*"];
  const key = domains.sort().join(",");

  if (!ipxInstances.has(key)) {
    ipxInstances.set(
      key,
      createIPX({
        // Local storage (required but not used for remote images)
        storage: ipxFSStorage({ dir: path.join(process.cwd(), "public") }),
        // HTTP storage for remote images
        httpStorage: ipxHttpStorage({
          domains: domains[0] === "*" ? undefined : domains,
        }),
      }),
    );
  }

  return ipxInstances.get(key)!;
}

/**
 * Clear all cached IPX instances
 * Useful for testing or when domains are updated
 */
export function clearIPXCache() {
  ipxInstances.clear();
}
