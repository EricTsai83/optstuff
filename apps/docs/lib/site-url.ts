export function getSiteBaseUrl(): URL {
  return new URL(
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3002",
  );
}
