import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  cacheComponents: true,
  images: {
    qualities: [20, 75, 80, 85, 90],
  },
};

export default nextConfig;
