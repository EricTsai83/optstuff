import {
  HOME_HERO_IMAGE,
  HomePageContent,
} from "@/components/home-page-content";
import { getBlurDataUrl } from "@/lib/optstuff";
import { cacheLife } from "next/cache";

const HERO_BLUR_OPTIONS = {
  format: "webp" as const,
  quality: 20,
  width: 32,
};

/**
 * Get the cached blur data URL for the hero image.
 *
 * This function is cached for 1 hour.
 *
 * @returns The cached blur data URL.
 * @see https://nextjs.org/docs/app/api-reference/directives/use-cache
 */
async function getCachedHeroBlurDataUrl() {
  "use cache";
  cacheLife("hours");
  return getBlurDataUrl(HOME_HERO_IMAGE, HERO_BLUR_OPTIONS);
}

export default async function Home() {
  const heroBlurDataUrl = await getCachedHeroBlurDataUrl();
  return <HomePageContent heroBlurDataUrl={heroBlurDataUrl} />;
}
