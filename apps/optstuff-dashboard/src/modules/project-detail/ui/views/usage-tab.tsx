"use client";

import { formatBytes, formatNumber } from "@/lib/format";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Activity, HardDrive, ShieldCheck, Timer } from "lucide-react";
import { useState } from "react";
import { STATUS_OPTIONS } from "../../lib/date-range-utils";
import { BandwidthSavingsCard } from "../components/bandwidth-savings-card";
import { DateRangeCalendarPicker } from "../components/date-range-calendar-picker";
import { RequestLogsTable } from "../components/request-logs-table";
import { StatCard } from "../components/stat-card";
import { StatusFilterDropdown } from "../components/status-filter-dropdown";
import { TimePresetPicker } from "../components/time-preset-picker";
import { TopImagesList } from "../components/top-images-list";
import { UsageChart } from "../components/usage-chart";
import { UsageSyncPanel } from "../components/usage-sync-panel";
import { useDateRange } from "../hooks/use-date-range";
import { useUsageData } from "../hooks/use-usage-data";

/** Props for {@link UsageTab}. */
type UsageTabProps = {
  /** The project whose usage data to display. */
  readonly projectId: string;
};

/**
 * Main usage analytics view for a project.
 *
 * Composes date-range pickers, status filters, stat cards, a usage chart,
 * bandwidth savings, top images, and request logs into a single dashboard tab.
 */
export function UsageTab({ projectId }: UsageTabProps) {
  const dateRange = useDateRange();
  const [statusFilters, setStatusFilters] = useState<Set<string>>(
    () => new Set(STATUS_OPTIONS.map((s) => s.value)),
  );

  const {
    usageSummary,
    isSummaryLoading,
    meteringStatus,
    isMeteringStatusLoading,
    isMeteringStatusError,
    meteringStatusError,
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
  } = useUsageData({
    projectId,
    days: dateRange.days,
    computedDateRange: dateRange.computedDateRange,
    statusFilters,
  });

  const trendLabel = `vs prev ${dateRange.days}d`;
  const avgResponseTimeDisplay =
    bandwidthSavings?.avgProcessingTimeMs === null
      ? "—"
      : `${bandwidthSavings?.avgProcessingTimeMs ?? 0}ms`;

  if (isSummaryLoading) {
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

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 md:flex-nowrap md:gap-3">
          <TimePresetPicker
            preset={dateRange.preset}
            open={dateRange.presetOpen}
            onOpenChange={dateRange.setPresetOpen}
            timeInput={dateRange.timeInput}
            onTimeInputChange={dateRange.setTimeInput}
            onTimeInputKeyDown={dateRange.handleTimeInputKeyDown}
            onPresetChange={dateRange.handlePresetChange}
            onTimeInputApply={dateRange.handleTimeInputApply}
          />

          <DateRangeCalendarPicker
            open={dateRange.calendarOpen}
            onOpenChange={dateRange.setCalendarOpen}
            committedRange={dateRange.committedRange}
            calendarRange={dateRange.calendarRange}
            onDateRangeSelect={dateRange.handleDateRangeSelect}
            startDateInput={dateRange.startDateInput}
            onStartDateInputChange={dateRange.setStartDateInput}
            startTimeInput={dateRange.startTimeInput}
            onStartTimeInputChange={dateRange.setStartTimeInput}
            endDateInput={dateRange.endDateInput}
            onEndDateInputChange={dateRange.setEndDateInput}
            endTimeInput={dateRange.endTimeInput}
            onEndTimeInputChange={dateRange.setEndTimeInput}
            onManualApply={dateRange.handleManualApply}
          />

          <StatusFilterDropdown
            statusFilters={statusFilters}
            onStatusFiltersChange={setStatusFilters}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <UsageSyncPanel
          projectId={projectId}
          meteringStatus={meteringStatus}
          isLoading={isMeteringStatusLoading}
          isMeteringStatusError={isMeteringStatusError}
          meteringStatusError={meteringStatusError}
        />
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
          value={avgResponseTimeDisplay}
          icon={<Timer className="h-4 w-4" />}
        />
      </div>

      <UsageChart
        data={dailyVolume ?? []}
        days={dateRange.days}
        isLoading={isDailyLoading}
      />

      <BandwidthSavingsCard
        totalOriginalSize={bandwidthSavings?.totalOriginalSize ?? 0}
        totalOptimizedSize={bandwidthSavings?.totalOptimizedSize ?? 0}
        bandwidthSaved={bandwidthSavings?.bandwidthSaved ?? 0}
        savingsPercentage={bandwidthSavings?.savingsPercentage ?? 0}
        pairedSizeSamples={bandwidthSavings?.pairedSizeSamples ?? 0}
        successfulRequests={bandwidthSavings?.successfulRequests ?? 0}
        sampleCoveragePercentage={
          bandwidthSavings?.sampleCoveragePercentage ?? 0
        }
        isEstimated={bandwidthSavings?.isEstimated ?? false}
        isLoading={isBandwidthLoading}
      />

      <TopImagesList images={topImages ?? []} isLoading={isTopImagesLoading} />

      <RequestLogsTable logs={filteredLogs} isLoading={isLogsLoading} />
    </div>
  );
}
