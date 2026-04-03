import { env } from "@/env";

function parseSiteUrl(
  rawValue: string,
  source: "NEXT_PUBLIC_APP_URL" | "VERCEL_URL",
): URL {
  const trimmedValue = rawValue.trim();
  const normalizedValue =
    /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(trimmedValue) ||
    trimmedValue.startsWith("/")
      ? trimmedValue
      : `https://${trimmedValue}`;

  try {
    return new URL(normalizedValue);
  } catch {
    throw new Error(
      `Invalid ${source}: expected a full URL or host value, received "${rawValue}".`,
    );
  }
}

export function getSiteBaseUrl(): URL {
  const appUrl = env.NEXT_PUBLIC_APP_URL?.trim();

  if (appUrl) {
    return parseSiteUrl(appUrl, "NEXT_PUBLIC_APP_URL");
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();

  if (vercelUrl) {
    return parseSiteUrl(vercelUrl, "VERCEL_URL");
  }

  if (env.NODE_ENV !== "production") {
    return new URL("http://localhost:3000");
  }

  throw new Error(
    "Missing site base URL in production. Set NEXT_PUBLIC_APP_URL or VERCEL_URL.",
  );
}
