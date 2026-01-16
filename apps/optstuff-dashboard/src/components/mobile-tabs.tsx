"use client";

import { useState } from "react";
import { Bell, Activity, FolderOpen } from "lucide-react";
import { api } from "@/trpc/react";
import { formatBytes, formatNumber } from "@/lib/format";

type MobileTabsProps = {
  readonly teamId: string;
};

type Tab = "projects" | "usage" | "alerts";

export function MobileTabs({ teamId }: MobileTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("projects");
  
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "projects", label: "Projects", icon: <FolderOpen className="h-4 w-4" /> },
    { id: "usage", label: "Usage", icon: <Activity className="h-4 w-4" /> },
    { id: "alerts", label: "Alerts", icon: <Bell className="h-4 w-4" /> },
  ];

  return (
    <div className="md:hidden">
      {/* Tab buttons */}
      <div className="border-border flex border-b">
        {tabs.map((tab) => (
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

      {/* Tab content */}
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

  if (!projects || projects.length === 0) {
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
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="bg-muted h-16 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  const limits = {
    requests: 10000,
    bandwidth: 1024 * 1024 * 1024,
  };

  const usageData = [
    {
      name: "API Requests",
      used: teamSummary?.totalRequests ?? 0,
      total: limits.requests,
      format: formatNumber,
    },
    {
      name: "Bandwidth",
      used: teamSummary?.totalBytes ?? 0,
      total: limits.bandwidth,
      format: formatBytes,
    },
  ];

  return (
    <div className="space-y-4">
      {usageData.map((item) => {
        const percentage = Math.min((item.used / item.total) * 100, 100);
        const isWarning = percentage > 80;
        const isDanger = percentage > 95;

        return (
          <div key={item.name} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    isDanger
                      ? "bg-red-500"
                      : isWarning
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                />
                <span className="text-foreground">{item.name}</span>
              </div>
              <span className="text-muted-foreground">
                {item.format(item.used)} / {item.format(item.total)}
              </span>
            </div>
            <div className="bg-muted h-2 overflow-hidden rounded-full">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isDanger
                    ? "bg-red-500"
                    : isWarning
                      ? "bg-yellow-500"
                      : "bg-green-500"
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
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
