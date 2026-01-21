/**
 * Get allowed request origin domain for Proxy middleware
 */
export function getVercelProjectUrl() {
  const protocol = process.env.VERCEL_PROJECT_PRODUCTION_URL?.startsWith("https")
    ? "https"
    : "http";
  const url = new URL(`${protocol}://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  return url;
}
