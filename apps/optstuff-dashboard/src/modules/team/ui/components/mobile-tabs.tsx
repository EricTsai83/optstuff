"use client";

import { useState } from "react";
import { Bell, Activity, FolderOpen } from "lucide-react";
import { api } from "@/trpc/react";
import { formatBytes, formatNumber } from "@/lib/format";
import { USAGE_LIMITS } from "@/lib/constants";
import {
  UsageProgressBar,
  UsageProgressBarSkeleton,
} from "@/components/usage-progress-bar";

type MobileTabsProps = {
  readonly teamId: string;
};

type Tab = "projects" | "usage" | "alerts";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "projects",
    label: "Projects",
    icon: <FolderOpen className="h-4 w-4" />,
  },
  { id: "usage", label: "Usage", icon: <Activity className="h-4 w-4" /> },
  { id: "alerts", label: "Alerts", icon: <Bell className="h-4 w-4" /> },
];

export function MobileTabs({ teamId }: MobileTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("projects");

  return (
    <div className="md:hidden">
      <div className="border-border flex border-b">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "text-foreground border-foreground border-b-2"
                : "text-muted-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="py-4">
        {activeTab === "projects" && <ProjectsTabContent teamId={teamId} />}
        {activeTab === "usage" && <UsageTabContent teamId={teamId} />}
        {activeTab === "alerts" && <AlertsTabContent />}
      </div>
    </div>
  );
}

function ProjectsTabContent({ teamId }: { teamId: string }) {
  const { data: projects, isLoading } = api.project.list.useQuery({ teamId });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-muted h-12 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!projects?.length) {
    return (
      <div className="text-muted-foreground flex flex-col items-center py-8 text-center">
        <FolderOpen className="mb-2 h-8 w-8 opacity-50" />
        <p className="text-sm">No projects yet</p>
      </div>
    );
  }

  return (
    <div className="text-muted-foreground text-center text-sm">
      {projects.length} project{projects.length !== 1 ? "s" : ""} in this team
    </div>
  );
}

function UsageTabContent({ teamId }: { teamId: string }) {
  const { data: teamSummary, isLoading } = api.usage.getTeamSummary.useQuery(
    { teamId },
    { enabled: !!teamId },
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <UsageProgressBarSkeleton />
        <UsageProgressBarSkeleton />
      </div>
    );
  }

  const usageData = [
    {
      name: "API Requests",
      used: teamSummary?.totalRequests ?? 0,
      total: USAGE_LIMITS.requests,
      format: formatNumber,
    },
    {
      name: "Bandwidth",
      used: teamSummary?.totalBytes ?? 0,
      total: USAGE_LIMITS.bandwidth,
      format: formatBytes,
    },
  ];

  return (
    <div className="space-y-4">
      {usageData.map((item) => (
        <UsageProgressBar
          key={item.name}
          label={item.name}
          used={item.used}
          total={item.total}
          format={item.format}
          compact
        />
      ))}
    </div>
  );
}

function AlertsTabContent() {
  return (
    <div className="text-muted-foreground flex flex-col items-center py-8 text-center">
      <Bell className="mb-2 h-8 w-8 opacity-50" />
      <p className="text-sm">No alerts at this time</p>
      <p className="mt-1 text-xs opacity-75">
        You&apos;ll be notified of important events
      </p>
    </div>
  );
}
