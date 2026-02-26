import type { LucideIcon } from "lucide-react";
import { Activity, Code, Key, LayoutDashboard, Settings } from "lucide-react";

export type ProjectTab =
  | "overview"
  | "api-keys"
  | "usage"
  | "developer"
  | "settings";

type ProjectTabConfig = {
  readonly value: ProjectTab;
  readonly label: string;
  readonly icon: LucideIcon;
};

export const PROJECT_TABS: readonly ProjectTabConfig[] = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "api-keys", label: "API Keys", icon: Key },
  { value: "usage", label: "Usage", icon: Activity },
  { value: "developer", label: "Developer", icon: Code },
  { value: "settings", label: "Settings", icon: Settings },
];
