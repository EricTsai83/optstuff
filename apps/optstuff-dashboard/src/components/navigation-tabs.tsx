"use client";

import { useIsMobile } from "@workspace/hooks/use-mobile";
import { useScroll } from "@workspace/hooks/use-scroll";
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import type { LucideIcon } from "lucide-react";

const MAX_SCROLL = 64;
const TRANSLATE_X_MULTIPLIER = 0.8;

type TabItem = {
  readonly value: string;
  readonly label: string;
  readonly icon?: LucideIcon;
};

type NavigationTabsProps = {
  readonly tabs: readonly TabItem[];
  readonly activeTab: string;
  readonly onTabChange: (tab: string) => void;
};

export function NavigationTabs({
  tabs,
  activeTab,
  onTabChange,
}: NavigationTabsProps) {
  const scrollY = useScroll();
  const isMobile = useIsMobile();

  const translateX = isMobile
    ? 0
    : Math.min(scrollY, MAX_SCROLL) * TRANSLATE_X_MULTIPLIER;

  return (
    <Tabs
      value={activeTab}
      onValueChange={onTabChange}
      className="border-border bg-background scrollbar-hide sticky top-0 z-50 max-w-full overflow-hidden border-b pt-1"
      data-navigation-tabs="true"
    >
      <TabsList
        className="scrollbar-hide h-[46px] w-full justify-start gap-0 overflow-x-auto rounded-none border-none bg-transparent px-2 *:shrink-0 md:px-4"
        style={
          translateX ? { transform: `translateX(${translateX}px)` } : undefined
        }
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="data-[state=active]:border-foreground text-muted-foreground data-[state=active]:text-foreground cursor-pointer whitespace-nowrap rounded-none border-b-2 border-transparent px-3 py-3 text-sm shadow-none transition-all duration-200 data-[state=active]:bg-transparent data-[state=active]:font-medium data-[state=active]:shadow-none"
          >
            {tab.icon && <tab.icon className="h-4 w-4" />}
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
