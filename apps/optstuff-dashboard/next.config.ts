/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  // A zone is a normal Next.js application where you also configure an assetPrefix to avoid conflicts with pages and static files in other zones. The default application handling all paths not routed to another more specific zone does not need an `assetPrefix`.
  assetPrefix: "/dashboard-static",
  typescript: {
    ignoreBuildErrors: true,
  },
  // https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages
  transpilePackages: ["@workspace/ui"],
  basePath: "/dashboard",
};

export default nextConfig;
