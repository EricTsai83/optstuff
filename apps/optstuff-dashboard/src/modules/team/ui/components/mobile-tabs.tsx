"use client";

import {
  UsageProgressBar,
  UsageProgressBarSkeleton,
} from "@/components/usage-progress-bar";
import { USAGE_LIMITS } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { api } from "@/trpc/react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { Activity, BarChart3 } from "lucide-react";

type MobileTabsProps = {
  readonly teamId: string;
};

const TABS = [
  { id: "usage", label: "Usage", icon: <Activity className="h-4 w-4" /> },
  {
    id: "stats",
    label: "Quick Stats",
    icon: <BarChart3 className="h-4 w-4" />,
  },
] as const;

export function MobileTabs({ teamId }: MobileTabsProps) {
  const {
    data: teamSummary,
    isLoading,
    isError,
  } = api.usage.getTeamSummary.useQuery({ teamId }, { enabled: !!teamId });

  return (
    <Tabs defaultValue="usage" className="md:hidden">
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

      <TabsContent value="usage" className="mt-0 py-4">
        {isLoading ? (
          <div className="space-y-4">
            <UsageProgressBarSkeleton compact />
            <UsageProgressBarSkeleton compact />
          </div>
        ) : isError ? (
          <div className="text-destructive py-6 text-center text-sm">
            Failed to load usage data
          </div>
        ) : teamSummary ? (
          <div className="space-y-4">
            <UsageProgressBar
              label="API Requests"
              used={teamSummary.totalRequests}
              total={USAGE_LIMITS.requests}
              formatType="number"
              compact
            />
            <UsageProgressBar
              label="Bandwidth"
              used={teamSummary.totalBytes}
              total={USAGE_LIMITS.bandwidth}
              formatType="bytes"
              compact
            />
          </div>
        ) : (
          <div className="text-muted-foreground py-6 text-center text-sm">
            No usage data available
          </div>
        )}
      </TabsContent>

      <TabsContent value="stats" className="mt-0 py-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="bg-muted mx-auto h-8 w-8 animate-pulse rounded" />
              <div className="bg-muted mx-auto mt-1 h-4 w-14 animate-pulse rounded" />
            </div>
            <div className="text-center">
              <div className="bg-muted mx-auto h-8 w-10 animate-pulse rounded" />
              <div className="bg-muted mx-auto mt-1 h-4 w-16 animate-pulse rounded" />
            </div>
          </div>
        ) : isError ? (
          <div className="text-destructive py-6 text-center text-sm">
            Failed to load stats
          </div>
        ) : teamSummary ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {teamSummary.projectCount}
              </div>
              <div className="text-muted-foreground text-xs">Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatNumber(teamSummary.totalRequests)}
              </div>
              <div className="text-muted-foreground text-xs">Requests</div>
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground py-6 text-center text-sm">
            No stats available
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
