/** @type {import('next').NextConfig} */

const nextConfig = {
  // https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages
  transpilePackages: ["@workspace/ui", "@workspace/auth", "@workspace/hooks"],
  experimental: {
    // Allow Server Actions from the microfrontends local proxy
    serverActions: {
      allowedOrigins: ["localhost:3024"],
    },
  },
  // A zone is a normal Next.js application where you also configure an assetPrefix to avoid conflicts with pages and static files in other zones. The default application handling all paths not routed to another more specific zone does not need an `assetPrefix`.
  assetPrefix: "/home-static",
  basePath: "/home",
};

export default nextConfig;
