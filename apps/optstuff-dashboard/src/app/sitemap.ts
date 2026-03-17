import { getSiteBaseUrl } from "@/lib/site-url";
import type { MetadataRoute } from "next";

// Add shared-host public routes here when a marketing microfrontend path should be indexed.
// Dashboard-only routes such as `/sign-in` or `/:team` should stay out of the sitemap.
const publicRoutes: Array<{
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
}> = [
  {
    path: "/",
    changeFrequency: "weekly",
    priority: 1,
  },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteBaseUrl();
  const lastModified = new Date();

  return publicRoutes.map((route) => ({
    url: new URL(route.path, baseUrl).toString(),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
