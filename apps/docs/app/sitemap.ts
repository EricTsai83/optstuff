import { getSiteBaseUrl } from "@/lib/site-url";
import { source } from "@/lib/source";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteBaseUrl();
  const lastModified = new Date();

  // Docs routes are discovered from the Fumadocs source, so new MDX pages are added automatically.
  return source
    .getPages()
    .sort((a, b) => a.url.localeCompare(b.url))
    .map((page) => ({
      url: new URL(page.url, baseUrl).toString(),
      lastModified,
      changeFrequency: page.url === "/" ? ("weekly" as const) : ("monthly" as const),
      priority: page.url === "/" ? 1 : 0.7,
    }));
}
