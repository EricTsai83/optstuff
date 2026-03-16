import { getSiteBaseUrl } from "@/lib/site-url";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteBaseUrl();

  return {
    // Keep docs crawlable, including LLM-friendly text routes, while excluding internal API endpoints.
    rules: {
      userAgent: "*",
      allow: ["/", "/llms.txt", "/llms-full.txt", "/llms.mdx/"],
      disallow: ["/api/"],
    },
    sitemap: new URL("/sitemap.xml", baseUrl).toString(),
  };
}
