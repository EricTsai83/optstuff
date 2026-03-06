"use client";

import { formatBytes, formatNumber } from "@/lib/format";
import { api } from "@/trpc/react";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { cn } from "@workspace/ui/lib/utils";
import { Activity, HardDrive, ShieldCheck, Timer } from "lucide-react";
import { useMemo, useState } from "react";
import { BandwidthSavingsCard } from "../components/bandwidth-savings-card";
import { RequestLogsTable } from "../components/request-logs-table";
import { StatCard } from "../components/stat-card";
import { TopImagesList } from "../components/top-images-list";
import { UsageChart } from "../components/usage-chart";

type UsageTabProps = {
  readonly projectId: string;
};

const TIME_RANGES = [
  { label: "7D", value: 7 },
  { label: "30D", value: 30 },
  { label: "90D", value: 90 },
] as const;

function calcTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function UsageTab({ projectId }: UsageTabProps) {
  const [days, setDays] = useState(30);

  const dateRange = useMemo(() => {
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    return {
      startDate: start.toISOString().split("T")[0]!,
      endDate: end.toISOString().split("T")[0]!,
    };
  }, [days]);

  const trendLabel = `vs prev ${days}d`;

  const { data: usageSummary, isLoading } = api.usage.getSummary.useQuery({
    projectId,
    days,
  });

  const { data: dailyVolume, isLoading: isDailyLoading } =
    api.requestLog.getDailyVolume.useQuery({
      projectId,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });

  const { data: bandwidthSavings, isLoading: isBandwidthLoading } =
    api.requestLog.getBandwidthSavings.useQuery({ projectId });

  const { data: topImages, isLoading: isTopImagesLoading } =
    api.requestLog.getTopImages.useQuery({ projectId, limit: 10 });

  const { data: recentLogs, isLoading: isLogsLoading } =
    api.requestLog.getRecentLogs.useQuery({ projectId, limit: 20 });

  const successRate =
    bandwidthSavings && bandwidthSavings.totalRequests > 0
      ? Math.round(
          (bandwidthSavings.successfulRequests /
            bandwidthSavings.totalRequests) *
            100,
        )
      : 0;

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4 sm:p-6">
              <div className="bg-muted mb-2 h-4 w-24 animate-pulse rounded" />
              <div className="bg-muted h-8 w-20 animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const prev = usageSummary?.previousPeriod as
    | { totalRequests: number; totalBytes: number }
    | undefined;
  const requestsTrend = calcTrend(
    usageSummary?.totalRequests ?? 0,
    prev?.totalRequests ?? 0,
  );
  const bandwidthTrend = calcTrend(
    usageSummary?.totalBytes ?? 0,
    prev?.totalBytes ?? 0,
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-1 self-start rounded-lg border p-1">
        {TIME_RANGES.map((range) => (
          <Button
            key={range.value}
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 px-3 text-xs font-medium",
              days === range.value &&
                "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
            )}
            onClick={() => setDays(range.value)}
          >
            {range.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Requests"
          value={formatNumber(usageSummary?.totalRequests ?? 0)}
          icon={<Activity className="h-4 w-4" />}
          trend={{ value: requestsTrend, label: trendLabel }}
        />
        <StatCard
          title="Bandwidth"
          value={formatBytes(usageSummary?.totalBytes ?? 0)}
          icon={<HardDrive className="h-4 w-4" />}
          trend={{ value: bandwidthTrend, label: trendLabel }}
        />
        <StatCard
          title="Success Rate"
          value={`${successRate}%`}
          icon={<ShieldCheck className="h-4 w-4" />}
          subtitle={`${formatNumber(bandwidthSavings?.successfulRequests ?? 0)} / ${formatNumber(bandwidthSavings?.totalRequests ?? 0)} requests`}
        />
        <StatCard
          title="Avg Response Time"
          value={`${bandwidthSavings?.avgProcessingTimeMs ?? 0}ms`}
          icon={<Timer className="h-4 w-4" />}
        />
      </div>

      <UsageChart data={dailyVolume ?? []} days={days} isLoading={isDailyLoading} />

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

      <RequestLogsTable logs={recentLogs ?? []} isLoading={isLogsLoading} />
    </div>
  );
}
