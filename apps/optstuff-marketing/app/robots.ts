import { getProjectBaseUrl } from "@/lib/utils";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getProjectBaseUrl();

  return {
    // This applies when the marketing app is deployed on its own host or preview URL.
    // On the shared production host, the root app owns `/robots.txt` and mirrors public routes there.
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: new URL("/sitemap.xml", baseUrl).toString(),
  };
}
