/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.ts";

import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  assetPrefix: "/blog-static",
  async rewrites() {
    return [
      {
        source: "/blog",
        destination: `${process.env.BLOG_DOMAIN}/blog`,
      },
      {
        source: "/blog/:path+",
        destination: `${process.env.BLOG_DOMAIN}/blog/:path+`,
      },
      {
        source: "/blog-static/:path+",
        destination: `${process.env.BLOG_DOMAIN}/blog-static/:path+`,
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
