/** @type {import('next').NextConfig} */
const nextConfig = {
  // https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages
  transpilePackages: ["@workspace/ui"],
  experimental: {
    // Allow Server Actions from the microfrontends local proxy
    serverActions: {
      allowedOrigins: ["localhost:3024"],
    },
  },
};

export default nextConfig;
