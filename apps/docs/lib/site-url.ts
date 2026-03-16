export function getSiteBaseUrl(): URL {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (siteUrl) {
    try {
      return new URL(siteUrl);
    } catch {
      return new URL(`https://${siteUrl}`);
    }
  }

  return new URL(
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3002",
  );
}
