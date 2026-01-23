/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import { withMicrofrontends } from "@vercel/microfrontends/next/config";
import "./src/env.js";

import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages
  transpilePackages: ["@workspace/ui", "@workspace/auth", "@workspace/hooks"],
  experimental: {
    // Allow Server Actions from the microfrontends local proxy
    serverActions: {
      allowedOrigins: ["localhost:3024"],
    },
  },
  // Turbopack configuration to silence the webpack config warning
  turbopack: {},
};

export default withMicrofrontends(nextConfig);
