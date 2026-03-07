"use client";

import { api } from "@/trpc/react";
import { calcTrend, STATUS_OPTIONS } from "../../lib/date-range-utils";

/** Parameters for the {@link useUsageData} hook. */
type UseUsageDataParams = {
  /** The project to fetch usage data for. */
  projectId: string;
  /** Number of days in the selected range (used for summary comparison). */
  days: number;
  /** Full ISO timestamps derived from the committed date range. */
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
  const { startDate, endDate } = computedDateRange;

  const {
    data: usageSummary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    error: summaryError,
  } = api.usage.getSummary.useQuery({ projectId, days, startDate, endDate });

  const {
    data: dailyVolume,
    isLoading: isDailyLoading,
    isError: isDailyError,
    error: dailyError,
  } = api.requestLog.getDailyVolume.useQuery({
    projectId,
    startDate,
    endDate,
  });

  const {
    data: bandwidthSavings,
    isLoading: isBandwidthLoading,
    isError: isBandwidthError,
    error: bandwidthError,
  } = api.requestLog.getBandwidthSavings.useQuery({
    projectId,
    startDate,
    endDate,
  });

  const {
    data: topImages,
    isLoading: isTopImagesLoading,
    isError: isTopImagesError,
    error: topImagesError,
  } = api.requestLog.getTopImages.useQuery({
    projectId,
    startDate,
    endDate,
    limit: 10,
  });

  const allStatusesSelected = statusFilters.size === STATUS_OPTIONS.length;

  const {
    data: filteredLogs,
    isLoading: isLogsLoading,
    isError: isLogsError,
    error: logsError,
  } = api.requestLog.getRecentLogs.useQuery({
    projectId,
    startDate,
    endDate,
    limit: 20,
    statuses: allStatusesSelected ? undefined : [...statusFilters],
  });

  const prev = usageSummary?.previousPeriod;

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

  const isError =
    isSummaryError ||
    isDailyError ||
    isBandwidthError ||
    isTopImagesError ||
    isLogsError;

  return {
    usageSummary,
    isSummaryLoading,
    isSummaryError,
    summaryError,
    dailyVolume,
    isDailyLoading,
    isDailyError,
    dailyError,
    bandwidthSavings,
    isBandwidthLoading,
    isBandwidthError,
    bandwidthError,
    topImages,
    isTopImagesLoading,
    isTopImagesError,
    topImagesError,
    filteredLogs: filteredLogs ?? [],
    isLogsLoading,
    isLogsError,
    logsError,
    requestsTrend,
    bandwidthTrend,
    successRate,
    isError,
  };
}
