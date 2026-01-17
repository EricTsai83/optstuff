"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { api } from "@/trpc/react";
import { formatBytes, formatNumber } from "@/lib/format";
import { SimpleStatCard } from "../components/simple-stat-card";

type UsageTabProps = {
  readonly projectId: string;
};

export function UsageTab({ projectId }: UsageTabProps) {
  const { data: usageSummary, isLoading } = api.usage.getSummary.useQuery({
    projectId,
  });
  const { data: dailyUsage, isLoading: isDailyLoading } =
    api.usage.getDailyUsage.useQuery({
      projectId,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0]!,
      endDate: new Date().toISOString().split("T")[0]!,
    });

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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <SimpleStatCard
          title="Total Requests"
          value={formatNumber(usageSummary?.totalRequests ?? 0)}
        />
        <SimpleStatCard
          title="Total Bandwidth"
          value={formatBytes(usageSummary?.totalBytes ?? 0)}
        />
        <SimpleStatCard
          title="Avg Daily Requests"
          value={formatNumber(usageSummary?.averageDailyRequests ?? 0)}
        />
        <SimpleStatCard
          title="Avg Daily Bandwidth"
          value={formatBytes(usageSummary?.averageDailyBytes ?? 0)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Usage</CardTitle>
          <CardDescription>Last 30 days of API usage</CardDescription>
        </CardHeader>
        <CardContent>
          {isDailyLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-muted/50 flex items-center justify-between rounded-lg px-4 py-2"
                >
                  <div className="bg-muted h-4 w-24 animate-pulse rounded" />
                  <div className="flex items-center gap-6">
                    <div className="bg-muted h-4 w-20 animate-pulse rounded" />
                    <div className="bg-muted h-4 w-16 animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : !dailyUsage?.length ? (
            <div className="text-muted-foreground py-8 text-center">
              No usage data yet
            </div>
          ) : (
            <div className="space-y-2">
              {dailyUsage.slice(0, 10).map((day) => (
                <div
                  key={day.date}
                  className="bg-muted/50 flex items-center justify-between rounded-lg px-4 py-2"
                >
                  <span className="text-sm">{day.date}</span>
                  <div className="flex items-center gap-6">
                    <span className="text-muted-foreground text-sm">
                      {formatNumber(day.requestCount)} requests
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {formatBytes(day.bytesProcessed)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
