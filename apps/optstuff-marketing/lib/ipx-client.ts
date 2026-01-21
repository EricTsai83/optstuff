import path from "path";
import { createIPX, ipxFSStorage, ipxHttpStorage } from "ipx";
import { getVercelProjectUrl } from "@/lib/utils";

/**
 * IPX image processing instance
 *
 * Supports:
 * - Local filesystem storage (public directory)
 * - HTTP remote images (only whitelisted domains, prevents SSRF attacks)
 */
const vercelUrl = getVercelProjectUrl();
const vercelDomain = vercelUrl.hostname;

export const ipx = createIPX({
  alias: {
    optstuff: vercelUrl.toString(),
  },
  storage: ipxFSStorage({ dir: path.join(process.cwd(), "public") }),
  httpStorage: ipxHttpStorage({
    domains: [vercelDomain], // only allow images from the Vercel project URL
  }),
});
