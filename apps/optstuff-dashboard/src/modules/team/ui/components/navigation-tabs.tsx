"use client";

import { useIsMobile } from "@workspace/hooks/use-mobile";
import { useScroll } from "@workspace/hooks/use-scroll";
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { NAV_TABS, SCROLL_CONFIG } from "../../constants";
import type { NavTab } from "../../types";

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
    <Tabs
      value={activeTab}
      onValueChange={(value) => onTabChange(value as NavTab)}
      className="border-border bg-background scrollbar-hide sticky top-0 z-50 border-b"
      data-navigation-tabs="true"
    >
      <TabsList
        className="h-[46px] w-full justify-start gap-0 overflow-x-auto rounded-none border-none bg-transparent px-2 *:shrink-0 md:px-4"
        style={{ transform: `translateX(${translateX}px)` }}
      >
        {NAV_TABS.map((tab) => (
          <TabsTrigger
            key={tab}
            value={tab}
            className="data-[state=active]:border-foreground text-muted-foreground data-[state=active]:text-foreground whitespace-nowrap rounded-none border-b-2 border-transparent px-3 py-3 text-sm shadow-none transition-all duration-200 data-[state=active]:bg-transparent data-[state=active]:font-medium data-[state=active]:shadow-none"
          >
            {tab}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
