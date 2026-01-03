/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  // assetPrefix: "/marketing-static",
  // serverExternalPackages: ["sharp", "ipx"],
  // async rewrites() {
  //   return [
  //     {
  //       source: "/home",
  //       destination: `${process.env.MARKETING_DOMAIN}/home`,
  //     },
  //     {
  //       source: "/blog",
  //       destination: `${process.env.MARKETING_DOMAIN}/blog`,
  //     },
  //     {
  //       source: "/blog/:path+",
  //       destination: `${process.env.MARKETING_DOMAIN}/blog/:path+`,
  //     },
  //     {
  //       source: "/marketing-static/:path+",
  //       destination: `${process.env.MARKETING_DOMAIN}/marketing-static/:path+`,
  //     },
  //   ];
  // },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
