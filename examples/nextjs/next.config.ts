import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  cacheComponents: true,
  images: {
    loader: "custom",
    loaderFile: "./src/lib/next-image-optstuff-loader.ts",
  },
};

export default nextConfig;
