"use client";

import { useScroll } from "@workspace/hooks/use-scroll";
import { useIsMobile } from "@workspace/hooks/use-mobile";
import { SCROLL_CONFIG } from "./scroll-config";
import { cn } from "@workspace/ui/lib/utils";

export const NAV_TABS = ["Overview", "Usage", "Settings"] as const;
export type NavTab = (typeof NAV_TABS)[number];

type NavigationTabsProps = {
  readonly activeTab: NavTab;
  readonly onTabChange: (tab: NavTab) => void;
};

export function NavigationTabs({
  activeTab,
  onTabChange,
}: NavigationTabsProps) {
  const scrollY = useScroll();
  const isMobile = useIsMobile();

  const translateX = isMobile
    ? 0
    : Math.min(scrollY, SCROLL_CONFIG.MAX_SCROLL) *
      SCROLL_CONFIG.NAVIGATION_TABS.TRANSLATE_X_MULTIPLIER;

  return (
    <nav
      data-navigation-tabs="true"
      className="border-border bg-background scrollbar-hide sticky top-0 z-50 flex h-[46px] items-center overflow-x-auto border-b px-2 *:shrink-0 md:px-4"
    >
      <div style={{ transform: `translateX(${translateX}px)` }}>
        {NAV_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={cn(
              "border-b-2 px-3 py-3 text-sm whitespace-nowrap transition-all duration-200",
              activeTab === tab
                ? "border-foreground text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:border-muted-foreground border-transparent",
            )}
          >
            {tab}
          </button>
        ))}
      </div>
    </nav>
  );
}
