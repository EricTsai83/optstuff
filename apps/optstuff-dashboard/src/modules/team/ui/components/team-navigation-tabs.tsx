"use client";

import { useIsMobile } from "@workspace/hooks/use-mobile";
import { useScroll } from "@workspace/hooks/use-scroll";
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import Link from "next/link";
import { usePathname } from "next/navigation";

const MAX_SCROLL = 64;
const TRANSLATE_X_MULTIPLIER = 0.8;

const TAB_LABELS = ["Overview", "Usage", "Settings"] as const;

function getTabHref(teamSlug: string, label: string): string {
  if (label === "Usage") return `/${teamSlug}/~/usage`;
  if (label === "Settings") return `/${teamSlug}/~/settings`;
  return `/${teamSlug}`;
}

function getActiveLabel(pathname: string, teamSlug: string): string {
  if (pathname.startsWith(`/${teamSlug}/~/usage`)) return "Usage";
  if (pathname.startsWith(`/${teamSlug}/~/settings`)) return "Settings";
  return "Overview";
}

type TeamNavigationTabsProps = {
  readonly teamSlug: string;
};

export function TeamNavigationTabs({ teamSlug }: TeamNavigationTabsProps) {
  const pathname = usePathname();
  const scrollY = useScroll();
  const isMobile = useIsMobile();

  const activeLabel = getActiveLabel(pathname, teamSlug);

  const translateX = isMobile
    ? 0
    : Math.min(scrollY, MAX_SCROLL) * TRANSLATE_X_MULTIPLIER;

  return (
    <Tabs
      value={activeLabel}
      className="border-border bg-background scrollbar-hide sticky top-0 z-50 max-w-full overflow-hidden border-b pt-1"
      data-navigation-tabs="true"
      asChild
    >
      <nav aria-label="Team navigation">
        <TabsList
          className="scrollbar-hide h-[46px] w-full justify-start gap-0 overflow-x-auto rounded-none border-none bg-transparent px-2 *:shrink-0 md:px-4"
          role="presentation"
          style={
            translateX
              ? {
                  transform: `translateX(${translateX}px)`,
                  maxWidth: `calc(100% - ${translateX}px)`,
                }
              : undefined
          }
        >
          {TAB_LABELS.map((label) => (
            <TabsTrigger
              key={label}
              value={label}
              asChild
              role="none"
              className="data-[state=active]:border-foreground text-muted-foreground data-[state=active]:text-foreground cursor-pointer whitespace-nowrap rounded-none border-b-2 border-transparent px-4 py-3 text-sm shadow-none transition-all duration-200 data-[state=active]:bg-transparent data-[state=active]:font-medium data-[state=active]:shadow-none"
            >
              <Link
                href={getTabHref(teamSlug, label)}
                aria-current={activeLabel === label ? "page" : undefined}
              >
                {label}
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </nav>
    </Tabs>
  );
}
