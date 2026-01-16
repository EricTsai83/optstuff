import path from "path";
import { createIPX, ipxFSStorage, ipxHttpStorage } from "ipx";
import { getIpxAllowedDomains } from "./allowed-domains";

/**
 * IPX image processing instance
 *
 * Supports:
 * - Local filesystem storage (public directory)
 * - HTTP remote images (only whitelisted domains, prevents SSRF attacks)
 */
export const ipx = createIPX({
  alias: {
    optstuff: "https://optstuff.vercel.app",
  },
  storage: ipxFSStorage({ dir: path.join(process.cwd(), "public") }),
  httpStorage: ipxHttpStorage({
    domains: getIpxAllowedDomains(),
  }),
});
