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
const isLocalhostFallback =
  projectDomain === "localhost" ||
  projectBaseUrl.origin === "http://localhost:3000";

if (process.env.NODE_ENV !== "development" && isLocalhostFallback) {
  throw new Error(
    "Invalid base URL configuration: resolved localhost fallback outside development. Set PROJECT_URL or VERCEL_URL for this environment.",
  );
}

export const ipx = createIPX({
  alias: {
    optstuff: projectBaseUrl.toString(),
  },
  storage: ipxFSStorage({ dir: path.join(process.cwd(), "public") }),
  httpStorage: ipxHttpStorage({
    domains: [projectDomain], // only allow images from the project base URL
  }),
});
