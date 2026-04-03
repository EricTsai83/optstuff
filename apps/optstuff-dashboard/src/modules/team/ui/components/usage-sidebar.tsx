"use client";

import { api } from "@/trpc/react";
import { GetStartedCard } from "./get-started-card";
import { QuickStatsCard } from "./quick-stats-card";
import { UsageCard } from "./usage-card";
import {
  QuickStatsSkeleton,
  UsageCardSkeleton,
} from "./usage-sidebar.skeleton";

type UsageSidebarProps = {
  readonly teamId: string;
};

export function UsageSidebar({ teamId }: UsageSidebarProps) {
  const { data: teamSummary } = api.usage.getTeamSummary.useQuery(
    { teamId },
    { enabled: !!teamId },
  );

  return (
    <div className="hidden w-80 shrink-0 space-y-6 md:block">
      {teamSummary ? (
        <>
          <UsageCard
            totalRequests={teamSummary.totalRequests}
            totalBytes={teamSummary.totalBytes}
          />
          <QuickStatsCard
            projectCount={teamSummary.projectCount}
            totalRequests={teamSummary.totalRequests}
          />
        </>
      ) : (
        <>
          <UsageCardSkeleton />
          <QuickStatsSkeleton />
        </>
      )}
      <GetStartedCard />
    </div>
  );
}
