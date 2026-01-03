/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  async rewrites() {
    return [
      {
        source: "/api/optimize/:path*",
        destination:
          // eslint-disable-next-line
          process.env.NODE_ENV === "production"
            ? "https://optstuff.vercel.app/api/optimize/:path*"
            : "http://localhost:3000/api/optimize/:path*",
      },
    ];
  },
};

export default nextConfig;
