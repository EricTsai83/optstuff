import { createIPX, ipxFSStorage, ipxHttpStorage } from "ipx";
import path from "path";

/**
 * Get or create an IPX instance for a set of allowed domains
 *
 * @param allowedDomains - List of allowed source domains
 * @returns IPX instance configured for the given domains
 */
export function getProjectIPX(allowedDomains: readonly string[] | null) {
  // If no domains specified, use a wildcard instance
  const domains =
    allowedDomains && allowedDomains.length > 0 ? [...allowedDomains] : ["*"];

  return createIPX({
    // Local storage (required but not used for remote images)
    storage: ipxFSStorage({ dir: path.join(process.cwd(), "public") }),
    // HTTP storage for remote images
    httpStorage: ipxHttpStorage({
      domains: domains[0] === "*" ? undefined : domains,
    }),
  });
}
