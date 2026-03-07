"use client";

import { useMemo } from "react";
import { api } from "@/trpc/react";
import { calcTrend, STATUS_OPTIONS } from "../../lib/date-range-utils";

const TOP_IMAGES_LIMIT = 10;
const RECENT_LOGS_LIMIT = 20;

/** Parameters for the {@link useUsageData} hook. */
type UseUsageDataParams = {
  /** The project to fetch usage data for. */
  projectId: string;
  /** Number of days in selected range (for summary trend baseline). */
  days: number;
  /** Full ISO timestamps derived from the committed date range. */
  computedDateRange: { startDate: string; endDate: string };
  /** Active request-status filters applied to the logs table. */
  statusFilters: Set<string>;
};

/**
 * Fetches and derives all usage-related data for a project.
 *
 * Orchestrates six tRPC queries (summary, metering status, daily volume,
 * bandwidth savings, top images, recent logs) and computes derived values such
 * as trend percentages, success rate, and status-filtered logs.
 *
 * @param params - Query inputs for the usage dashboard.
 * @param params.projectId - Current project identifier.
 * @param params.days - Selected range length, used by summary period comparison.
 * @param params.computedDateRange - ISO start/end timestamps from the date picker.
 * @param params.statusFilters - Active status values for request-log filtering.
 * @returns Aggregated query payloads and derived display metrics for the Usage tab.
 */
export function useUsageData({
  projectId,
  days,
  computedDateRange,
  statusFilters,
}: UseUsageDataParams) {
  const { startDate, endDate } = computedDateRange;
  const dateRangeQueryInput = useMemo(
    () => ({ projectId, startDate, endDate }),
    [projectId, startDate, endDate],
  );
  const allStatusesSelected = statusFilters.size === STATUS_OPTIONS.length;
  const selectedStatuses = useMemo(
    () => (allStatusesSelected ? undefined : Array.from(statusFilters)),
    [allStatusesSelected, statusFilters],
  );

  const {
    data: usageSummary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    error: summaryError,
  } = api.usage.getSummary.useQuery({ ...dateRangeQueryInput, days });

  const {
    data: dailyVolume,
    isLoading: isDailyLoading,
    isError: isDailyError,
    error: dailyError,
  } = api.requestLog.getDailyVolume.useQuery(dateRangeQueryInput);

  const {
    data: meteringStatus,
    isLoading: isMeteringStatusLoading,
    isError: isMeteringStatusError,
    error: meteringStatusError,
  } = api.usage.getMeteringStatus.useQuery({ projectId });

  const {
    data: bandwidthSavings,
    isLoading: isBandwidthLoading,
    isError: isBandwidthError,
    error: bandwidthError,
  } = api.requestLog.getBandwidthSavings.useQuery(dateRangeQueryInput);

  const {
    data: topImages,
    isLoading: isTopImagesLoading,
    isError: isTopImagesError,
    error: topImagesError,
  } = api.requestLog.getTopImages.useQuery({
    ...dateRangeQueryInput,
    limit: TOP_IMAGES_LIMIT,
  });

  const {
    data: filteredLogs,
    isLoading: isLogsLoading,
    isError: isLogsError,
    error: logsError,
  } = api.requestLog.getRecentLogs.useQuery({
    ...dateRangeQueryInput,
    limit: RECENT_LOGS_LIMIT,
    statuses: selectedStatuses,
  });

  const previousPeriod = usageSummary?.previousPeriod;
  const requestsTrend = calcTrend(
    usageSummary?.totalRequests ?? 0,
    previousPeriod?.totalRequests ?? 0,
  );
  const bandwidthTrend = calcTrend(
    usageSummary?.totalBytes ?? 0,
    previousPeriod?.totalBytes ?? 0,
  );

  const totalRequests = bandwidthSavings?.totalRequests ?? 0;
  const successfulRequests = bandwidthSavings?.successfulRequests ?? 0;
  const successRate =
    totalRequests > 0
      ? Math.round((successfulRequests / totalRequests) * 100)
      : 0;

  const isError = [
    isSummaryError,
    isMeteringStatusError,
    isDailyError,
    isBandwidthError,
    isTopImagesError,
    isLogsError,
  ].some(Boolean);

  return {
    usageSummary,
    isSummaryLoading,
    isSummaryError,
    summaryError,
    meteringStatus,
    isMeteringStatusLoading,
    isMeteringStatusError,
    meteringStatusError,
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
