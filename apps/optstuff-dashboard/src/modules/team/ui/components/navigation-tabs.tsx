"use client";

import { NavigationTabs as BaseNavigationTabs } from "@/components/navigation-tabs";
import { NAV_TABS } from "../../constants";
import type { NavTab } from "../../types";

type NavigationTabsProps = {
  readonly activeTab: NavTab;
  readonly onTabChange: (tab: NavTab) => void;
};

const tabs = NAV_TABS.map((tab) => ({ value: tab, label: tab }));

export function NavigationTabs({
  activeTab,
  onTabChange,
}: NavigationTabsProps) {
  return (
    <BaseNavigationTabs
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(value) => onTabChange(value as NavTab)}
    />
  );
}
