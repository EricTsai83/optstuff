"use client";

import { Activity, FolderOpen } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
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

const TABS = [
  { id: "projects", label: "Projects", icon: <FolderOpen className="h-4 w-4" /> },
  { id: "usage", label: "Usage", icon: <Activity className="h-4 w-4" /> },
] as const;

export function MobileTabs({ teamId }: MobileTabsProps) {
  return (
    <Tabs defaultValue="projects" className="md:hidden">
      <TabsList className="border-border h-auto w-full justify-start gap-0 rounded-none border-b bg-transparent p-0">
        {TABS.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="data-[state=active]:border-foreground text-muted-foreground data-[state=active]:text-foreground flex flex-1 items-center justify-center gap-2 rounded-none border-b-2 border-transparent py-3 text-sm font-medium shadow-none transition-colors data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            {tab.icon}
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="projects" className="mt-0 py-4">
        <ProjectsTabContent teamId={teamId} />
      </TabsContent>
      <TabsContent value="usage" className="mt-0 py-4">
        <UsageTabContent teamId={teamId} />
      </TabsContent>
    </Tabs>
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
