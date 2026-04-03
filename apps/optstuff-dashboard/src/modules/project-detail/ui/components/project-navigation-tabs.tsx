"use client";

import { useIsMobile } from "@workspace/hooks/use-mobile";
import { useScroll } from "@workspace/hooks/use-scroll";
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { PROJECT_TABS, type ProjectTab } from "../../constants";

const MAX_SCROLL = 64;
const TRANSLATE_X_MULTIPLIER = 0.8;

function getTabHref(
  teamSlug: string,
  projectSlug: string,
  tab: ProjectTab,
): string {
  if (tab === "overview") return `/${teamSlug}/${projectSlug}`;
  return `/${teamSlug}/${projectSlug}/~/${tab}`;
}

function getActiveTab(pathname: string): ProjectTab {
  for (const tab of PROJECT_TABS) {
    if (tab.value !== "overview" && pathname.includes(`/~/${tab.value}`)) {
      return tab.value;
    }
  }
  return "overview";
}

type ProjectNavigationTabsProps = {
  readonly teamSlug: string;
  readonly projectSlug: string;
};

export function ProjectNavigationTabs({
  teamSlug,
  projectSlug,
}: ProjectNavigationTabsProps) {
  const pathname = usePathname();
  const scrollY = useScroll();
  const isMobile = useIsMobile();

  const activeTab = getActiveTab(pathname);

  const translateX = isMobile
    ? 0
    : Math.min(scrollY, MAX_SCROLL) * TRANSLATE_X_MULTIPLIER;

  return (
    <Tabs
      value={activeTab}
      className="border-border bg-background scrollbar-hide sticky top-0 z-50 max-w-full overflow-hidden border-b pt-1"
      data-navigation-tabs="true"
      asChild
    >
      <nav aria-label="Project navigation">
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
          {PROJECT_TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              asChild
              role="none"
              className="data-[state=active]:border-foreground text-muted-foreground data-[state=active]:text-foreground cursor-pointer whitespace-nowrap rounded-none border-b-2 border-transparent px-4 py-3 text-sm shadow-none transition-all duration-200 data-[state=active]:bg-transparent data-[state=active]:font-medium data-[state=active]:shadow-none"
            >
              <Link
                href={getTabHref(teamSlug, projectSlug, tab.value)}
                aria-current={activeTab === tab.value ? "page" : undefined}
              >
                {tab.icon && <tab.icon className="h-4 w-4" />}
                {tab.label}
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </nav>
    </Tabs>
  );
}
