import { Activity, Code, Key, LayoutDashboard, Settings } from "lucide-react";

export const PROJECT_TABS = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "api-keys", label: "API Keys", icon: Key },
  { value: "usage", label: "Usage", icon: Activity },
  { value: "developer", label: "Developer", icon: Code },
  { value: "settings", label: "Settings", icon: Settings },
] as const;

export type ProjectTab = (typeof PROJECT_TABS)[number]["value"];

export function isProjectTab(tab: string): tab is ProjectTab {
  return PROJECT_TABS.some((projectTab) => projectTab.value === tab);
}
