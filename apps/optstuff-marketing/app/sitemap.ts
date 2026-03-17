import { getProjectBaseUrl } from "@/lib/utils";
import type { MetadataRoute } from "next";

// This applies when the marketing app is deployed on its own host or preview URL.
// On the shared production host, the root app owns `/sitemap.xml` and mirrors public routes there.
// Add new public marketing pages here when you want them included in sitemap.xml.
// Example: { path: "/pricing", changeFrequency: "monthly", priority: 0.8 }
const publicRoutes: Array<{
  path: string;
  changeFrequency: NonNullable<
    MetadataRoute.Sitemap[number]["changeFrequency"]
  >;
  priority: number;
}> = [
  {
    path: "/",
    changeFrequency: "weekly",
    priority: 1,
  },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getProjectBaseUrl();
  const lastModified = new Date();

  return publicRoutes.map((route) => ({
    url: new URL(route.path, baseUrl).toString(),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
