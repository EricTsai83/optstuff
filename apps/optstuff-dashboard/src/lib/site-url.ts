export function getSiteBaseUrl(): URL {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (appUrl) {
    return new URL(appUrl);
  }

  return new URL(
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000",
  );
}
