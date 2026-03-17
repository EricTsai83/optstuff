import { getSiteBaseUrl } from "@/lib/site-url";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteBaseUrl();

  return {
    // This shared host serves the public marketing homepage at `/`, but dashboard routes stay blocked.
    rules: {
      userAgent: "*",
      allow: ["/$", "/demo-image.png", "/demo-image.webp", "/opengraph-image", "/opengraph-image.png", "/favicon.ico"],
      disallow: "/*",
    },
    sitemap: new URL("/sitemap.xml", baseUrl).toString(),
  };
}
