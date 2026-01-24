"use client";

import { formatBytes, formatNumber } from "@/lib/format";
import { api } from "@/trpc/react";
import { Card, CardContent } from "@workspace/ui/components/card";
import { BandwidthSavingsCard } from "../components/bandwidth-savings-card";
import { RequestLogsTable } from "../components/request-logs-table";
import { StatCard } from "../components/stat-card";
import { TopImagesList } from "../components/top-images-list";
import { UsageChart } from "../components/usage-chart";

type UsageTabProps = {
  readonly projectId: string;
};

export function UsageTab({ projectId }: UsageTabProps) {
  // Usage summary
  const { data: usageSummary, isLoading } = api.usage.getSummary.useQuery({
    projectId,
  });

  // Daily usage for chart
  const { data: dailyUsage, isLoading: isDailyLoading } =
    api.usage.getDailyUsage.useQuery({
      projectId,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0]!,
      endDate: new Date().toISOString().split("T")[0]!,
    });

  // Bandwidth savings
  const { data: bandwidthSavings, isLoading: isBandwidthLoading } =
    api.requestLog.getBandwidthSavings.useQuery({ projectId });

  // Top images
  const { data: topImages, isLoading: isTopImagesLoading } =
    api.requestLog.getTopImages.useQuery({ projectId, limit: 10 });

  // Recent logs
  const { data: recentLogs, isLoading: isLogsLoading } =
    api.requestLog.getRecentLogs.useQuery({ projectId, limit: 20 });

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="bg-muted h-8 w-20 animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Requests"
          value={formatNumber(usageSummary?.totalRequests ?? 0)}
        />
        <StatCard
          title="Total Bandwidth"
          value={formatBytes(usageSummary?.totalBytes ?? 0)}
        />
        <StatCard
          title="Avg Daily Requests"
          value={formatNumber(usageSummary?.averageDailyRequests ?? 0)}
        />
        <StatCard
          title="Avg Daily Bandwidth"
          value={formatBytes(usageSummary?.averageDailyBytes ?? 0)}
        />
      </div>

      {/* Chart */}
      <UsageChart data={dailyUsage ?? []} isLoading={isDailyLoading} />

      {/* Bandwidth Savings and Top Images */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BandwidthSavingsCard
          totalOriginalSize={bandwidthSavings?.totalOriginalSize ?? 0}
          totalOptimizedSize={bandwidthSavings?.totalOptimizedSize ?? 0}
          bandwidthSaved={bandwidthSavings?.bandwidthSaved ?? 0}
          savingsPercentage={bandwidthSavings?.savingsPercentage ?? 0}
          isLoading={isBandwidthLoading}
        />
        <TopImagesList
          images={topImages ?? []}
          isLoading={isTopImagesLoading}
        />
      </div>

      {/* Recent Logs */}
      <RequestLogsTable logs={recentLogs ?? []} isLoading={isLogsLoading} />
    </div>
  );
}
