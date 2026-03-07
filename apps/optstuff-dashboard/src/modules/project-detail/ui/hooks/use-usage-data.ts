"use client";

import { api } from "@/trpc/react";
import { useMemo } from "react";
import { calcTrend, STATUS_OPTIONS } from "../../lib/date-range-utils";

/** Parameters for the {@link useUsageData} hook. */
type UseUsageDataParams = {
  /** The project to fetch usage data for. */
  projectId: string;
  /** Number of days in the selected range (used for summary comparison). */
  days: number;
  /** ISO date strings derived from the committed date range. */
  computedDateRange: { startDate: string; endDate: string };
  /** Active request-status filters applied to the logs table. */
  statusFilters: Set<string>;
};

/**
 * Fetches and derives all usage-related data for a project.
 *
 * Orchestrates five tRPC queries (summary, daily volume, bandwidth savings,
 * top images, recent logs) and computes derived values such as trend
 * percentages, success rate, and status-filtered logs.
 */
export function useUsageData({
  projectId,
  days,
  computedDateRange,
  statusFilters,
}: UseUsageDataParams) {
  const { data: usageSummary, isLoading: isSummaryLoading } =
    api.usage.getSummary.useQuery({ projectId, days });

  const { data: dailyVolume, isLoading: isDailyLoading } =
    api.requestLog.getDailyVolume.useQuery({
      projectId,
      startDate: computedDateRange.startDate,
      endDate: computedDateRange.endDate,
    });

  const { data: bandwidthSavings, isLoading: isBandwidthLoading } =
    api.requestLog.getBandwidthSavings.useQuery({ projectId });

  const { data: topImages, isLoading: isTopImagesLoading } =
    api.requestLog.getTopImages.useQuery({ projectId, limit: 10 });

  const { data: recentLogs, isLoading: isLogsLoading } =
    api.requestLog.getRecentLogs.useQuery({ projectId, limit: 20 });

  const allStatusesSelected = statusFilters.size === STATUS_OPTIONS.length;

  const filteredLogs = useMemo(() => {
    if (!recentLogs || allStatusesSelected) return recentLogs ?? [];
    return recentLogs.filter((log) => statusFilters.has(log.status));
  }, [recentLogs, statusFilters, allStatusesSelected]);

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

  const successRate =
    bandwidthSavings && bandwidthSavings.totalRequests > 0
      ? Math.round(
          (bandwidthSavings.successfulRequests /
            bandwidthSavings.totalRequests) *
            100,
        )
      : 0;

  return {
    usageSummary,
    isSummaryLoading,
    dailyVolume,
    isDailyLoading,
    bandwidthSavings,
    isBandwidthLoading,
    topImages,
    isTopImagesLoading,
    filteredLogs,
    isLogsLoading,
    requestsTrend,
    bandwidthTrend,
    successRate,
  };
}
