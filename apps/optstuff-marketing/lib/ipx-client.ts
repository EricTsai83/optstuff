import { getProjectBaseUrl } from "@/lib/utils";
import { createIPX, ipxFSStorage, ipxHttpStorage } from "ipx";
import path from "path";

/**
 * IPX image processing instance
 *
 * Supports:
 * - Local filesystem storage (public directory)
 * - HTTP remote images (only whitelisted domains, prevents SSRF attacks)
 */
const projectBaseUrl = getProjectBaseUrl();
const projectDomain = projectBaseUrl.hostname;

export const ipx = createIPX({
  alias: {
    optstuff: projectBaseUrl.toString(),
  },
  storage: ipxFSStorage({ dir: path.join(process.cwd(), "public") }),
  httpStorage: ipxHttpStorage({
    domains: [projectDomain], // only allow images from the project base URL
  }),
});
