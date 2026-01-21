/**
 * Get allowed request origin domain for Proxy middleware
 */
export function getVercelProjectUrl() {
  const protocol = process.env.PROJECT_URL?.startsWith("https")
    ? "https"
    : "http";
  const url = new URL(`${protocol}://${process.env.PROJECT_URL}`);
  return url;
}
