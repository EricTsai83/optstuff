"use client";

import { api } from "@/trpc/react";
import { GetStartedCard } from "./get-started-card";
import { QuickStatsCard } from "./quick-stats-card";
import { UsageCard } from "./usage-card";

type UsageSidebarProps = {
  readonly teamId: string;
};

export function UsageSidebar({ teamId }: UsageSidebarProps) {
  const { data: teamSummary, isLoading } = api.usage.getTeamSummary.useQuery(
    { teamId },
    { enabled: !!teamId },
  );

  return (
    <div className="hidden w-80 shrink-0 space-y-6 md:block">
      <UsageCard
        totalRequests={teamSummary?.totalRequests ?? 0}
        totalBytes={teamSummary?.totalBytes ?? 0}
        isLoading={isLoading}
      />
      <QuickStatsCard
        projectCount={teamSummary?.projectCount ?? 0}
        totalRequests={teamSummary?.totalRequests ?? 0}
      />
      <GetStartedCard />
    </div>
  );
}
