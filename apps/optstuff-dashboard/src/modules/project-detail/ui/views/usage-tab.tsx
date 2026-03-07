"use client";

import { formatBytes, formatNumber } from "@/lib/format";
import { api } from "@/trpc/react";
import { Button } from "@workspace/ui/components/button";
import { Calendar } from "@workspace/ui/components/calendar";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Input } from "@workspace/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { Separator } from "@workspace/ui/components/separator";
import { cn } from "@workspace/ui/lib/utils";
import { format } from "date-fns";
import {
  Activity,
  CalendarIcon,
  ChevronDown,
  Clock,
  HardDrive,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BandwidthSavingsCard } from "../components/bandwidth-savings-card";
import { RequestLogsTable } from "../components/request-logs-table";
import { StatCard } from "../components/stat-card";
import { TopImagesList } from "../components/top-images-list";
import { UsageChart } from "../components/usage-chart";

type DateRange = {
  from: Date | undefined;
  to?: Date | undefined;
};

type UsageTabProps = {
  readonly projectId: string;
};

const TIME_PRESETS = [
  { label: "Last 7 Days", value: "7", days: 7 },
  { label: "Last 14 Days", value: "14", days: 14 },
  { label: "Last 30 Days", value: "30", days: 30 },
  { label: "Last 90 Days", value: "90", days: 90 },
] as const;

const STATUS_OPTIONS = [
  { label: "Success", value: "success" },
  { label: "Error", value: "error" },
  { label: "Forbidden", value: "forbidden" },
  { label: "Rate Limited", value: "rate_limited" },
] as const;

function calcTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function getDateRangeFromDays(numDays: number): { from: Date; to: Date } {
  const to = new Date();
  to.setDate(to.getDate() - 1);
  to.setHours(23, 59, 59, 999);
  const from = new Date(to);
  from.setDate(from.getDate() - (numDays - 1));
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

function parseFixedDate(input: string): Date | null {
  const s = input.trim();
  const year = new Date().getFullYear();

  const slashMatch = /^(\d{1,2})\/(\d{1,2})$/.exec(s);
  if (slashMatch) {
    const m = Number(slashMatch[1]) - 1;
    const d = Number(slashMatch[2]);
    if (m >= 0 && m < 12 && d >= 1 && d <= 31) return new Date(year, m, d);
  }

  const nameMatch =
    /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{1,2})$/i.exec(
      s,
    );
  if (nameMatch) {
    const m = MONTHS[nameMatch[1]!.toLowerCase().slice(0, 3)]!;
    const d = Number(nameMatch[2]);
    if (d >= 1 && d <= 31) return new Date(year, m, d);
  }

  return null;
}

function parseTimeInput(input: string): DateRange | null {
  const s = input.trim().toLowerCase();
  if (!s) return null;

  const now = new Date();

  if (s === "today") {
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    return { from, to: now };
  }
  if (s === "yesterday") {
    const from = new Date(now);
    from.setDate(from.getDate() - 1);
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }
  if (s === "last month") {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { from, to };
  }
  if (s === "last week") {
    const from = new Date(now);
    from.setDate(from.getDate() - 7);
    from.setHours(0, 0, 0, 0);
    return { from, to: now };
  }

  const relMatch =
    /^(\d+)\s*(m|min|mins|minutes?|h|hr|hrs|hours?|d|days?|w|weeks?)$/.exec(s);
  if (relMatch) {
    const n = Number(relMatch[1]);
    const u = relMatch[2]!;
    const from = new Date(now);
    if (u.startsWith("m")) from.setMinutes(from.getMinutes() - n);
    else if (u.startsWith("h")) from.setHours(from.getHours() - n);
    else if (u.startsWith("d")) from.setDate(from.getDate() - n);
    else if (u.startsWith("w")) from.setDate(from.getDate() - n * 7);
    return { from, to: now };
  }

  if (/[-–]/.test(s)) {
    const parts = s.split(/\s*[-–]\s*/);
    if (parts.length === 2) {
      const from = parseFixedDate(parts[0]!);
      const to = parseFixedDate(parts[1]!);
      if (from && to) {
        to.setHours(23, 59, 59, 999);
        return { from, to };
      }
    }
  } else {
    const single = parseFixedDate(s);
    if (single) {
      const to = new Date(single);
      to.setHours(23, 59, 59, 999);
      return { from: single, to };
    }
  }

  return null;
}

export function UsageTab({ projectId }: UsageTabProps) {
  const [preset, setPreset] = useState("7");
  const [presetOpen, setPresetOpen] = useState(false);
  const [timeInput, setTimeInput] = useState("");
  const [calendarRange, setCalendarRange] = useState<DateRange>(() => {
    const { from, to } = getDateRangeFromDays(7);
    return { from, to };
  });
  const [committedRange, setCommittedRange] = useState(() =>
    getDateRangeFromDays(7),
  );
  const [statusFilters, setStatusFilters] = useState<Set<string>>(
    () => new Set(STATUS_OPTIONS.map((s) => s.value)),
  );

  const days = useMemo(() => {
    return Math.max(
      1,
      Math.ceil(
        (committedRange.to.getTime() - committedRange.from.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );
  }, [committedRange]);

  const computedDateRange = useMemo(() => {
    return {
      startDate: committedRange.from.toISOString().split("T")[0]!,
      endDate: committedRange.to.toISOString().split("T")[0]!,
    };
  }, [committedRange]);

  const commitRange = useCallback((from: Date, to: Date) => {
    setCommittedRange({ from, to });
    setCalendarRange({ from, to });
    setPreset("custom");
  }, []);

  const handlePresetChange = useCallback((value: string) => {
    setPreset(value);
    const numDays = Number(value);
    if (numDays) {
      const { from, to } = getDateRangeFromDays(numDays);
      setCalendarRange({ from, to });
      setCommittedRange({ from, to });
    }
    setTimeInput("");
    setPresetOpen(false);
  }, []);

  const handleTimeInputApply = useCallback((value: string) => {
    const parsed = parseTimeInput(value);
    if (parsed?.from && parsed.to) {
      setCalendarRange(parsed);
      setCommittedRange({ from: parsed.from, to: parsed.to });
      setPreset("custom");
      setTimeInput("");
      setPresetOpen(false);
    }
  }, []);

  const handleTimeInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleTimeInputApply(timeInput);
      }
    },
    [timeInput, handleTimeInputApply],
  );

  const handleDateRangeSelect = useCallback(
    (range: DateRange | undefined, triggerDate?: Date) => {
      if (calendarRange.from && calendarRange.to && triggerDate) {
        setCalendarRange({ from: triggerDate, to: undefined });
        return;
      }
      if (range) {
        setCalendarRange(range);
        if (range.from && range.to) {
          commitRange(range.from, range.to);
        }
      }
    },
    [calendarRange.from, calendarRange.to, commitRange],
  );

  const [startDateInput, setStartDateInput] = useState(() =>
    format(committedRange.from, "MMM d, yyyy"),
  );
  const [startTimeInput, setStartTimeInput] = useState("00:00");
  const [endDateInput, setEndDateInput] = useState(() =>
    format(committedRange.to, "MMM d, yyyy"),
  );
  const [endTimeInput, setEndTimeInput] = useState("23:59");
  const [calendarOpen, setCalendarOpen] = useState(false);

  const prevCommittedRef = useRef(committedRange);
  useEffect(() => {
    if (prevCommittedRef.current !== committedRange) {
      prevCommittedRef.current = committedRange;
      setStartDateInput(format(committedRange.from, "MMM d, yyyy"));
      setStartTimeInput(format(committedRange.from, "HH:mm"));
      setEndDateInput(format(committedRange.to, "MMM d, yyyy"));
      setEndTimeInput(format(committedRange.to, "HH:mm"));
    }
  }, [committedRange]);

  useEffect(() => {
    if (calendarRange.from) {
      setStartDateInput(format(calendarRange.from, "MMM d, yyyy"));
    }
    if (calendarRange.to) {
      setEndDateInput(format(calendarRange.to, "MMM d, yyyy"));
    }
  }, [calendarRange.from, calendarRange.to]);

  const handleManualApply = useCallback(() => {
    const parseManualDate = (dateStr: string, timeStr: string): Date | null => {
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return null;
      const [h, m] = timeStr.split(":").map(Number);
      if (h == null || m == null || Number.isNaN(h) || Number.isNaN(m))
        return null;
      d.setHours(h, m, 0, 0);
      return d;
    };

    const from = parseManualDate(startDateInput, startTimeInput);
    const to = parseManualDate(endDateInput, endTimeInput);
    if (from && to && from < to) {
      commitRange(from, to);
      setCalendarOpen(false);
    }
  }, [startDateInput, startTimeInput, endDateInput, endTimeInput, commitRange]);

  const handleStatusToggle = useCallback((status: string) => {
    setStatusFilters((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        if (next.size > 1) next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  }, []);

  const allStatusesSelected = statusFilters.size === STATUS_OPTIONS.length;
  const statusLabel = allStatusesSelected
    ? "All Statuses"
    : `${statusFilters.size} Status${statusFilters.size > 1 ? "es" : ""}`;

  const presetLabel =
    preset === "custom"
      ? "Custom"
      : (TIME_PRESETS.find((p) => p.value === preset)?.label ?? "Last 30 Days");

  const trendLabel = `vs prev ${days}d`;

  const { data: usageSummary, isLoading } = api.usage.getSummary.useQuery({
    projectId,
    days,
  });

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

  const filteredLogs = useMemo(() => {
    if (!recentLogs || allStatusesSelected) return recentLogs ?? [];
    return recentLogs.filter((log) => statusFilters.has(log.status));
  }, [recentLogs, statusFilters, allStatusesSelected]);

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
      <div className="flex flex-wrap items-center gap-2 md:flex-nowrap md:gap-3">
        <Popover open={presetOpen} onOpenChange={setPresetOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={presetOpen}
              className="h-9 gap-2 px-3 md:h-10 md:px-4"
            >
              <Clock className="h-4 w-4 shrink-0 opacity-50" />
              <span className="text-sm">{presetLabel}</span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 shrink-0 opacity-50 transition-transform",
                  presetOpen && "rotate-180",
                )}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex">
              <div className="border-r p-1 md:p-1.5">
                {TIME_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    className={cn(
                      "hover:bg-accent hover:text-accent-foreground flex w-full items-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm outline-none transition-colors md:px-4 md:py-2",
                      preset === p.value && "bg-accent font-medium",
                    )}
                    onClick={() => handlePresetChange(p.value)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="w-[220px] space-y-3 p-3 md:w-[260px] md:space-y-4 md:p-4">
                <Input
                  placeholder="e.g. 10d, last week..."
                  value={timeInput}
                  onChange={(e) => setTimeInput(e.target.value)}
                  onKeyDown={handleTimeInputKeyDown}
                  className="h-8 text-sm md:h-9"
                />
                <div className="space-y-2">
                  <p className="text-muted-foreground text-xs font-medium md:text-sm">
                    Type relative times
                  </p>
                  <div className="flex flex-wrap gap-1 md:gap-1.5">
                    {[
                      "45m",
                      "12 hours",
                      "10d",
                      "2 weeks",
                      "last month",
                      "yesterday",
                      "today",
                    ].map((hint) => (
                      <button
                        key={hint}
                        type="button"
                        className="bg-muted hover:bg-muted/70 rounded px-1.5 py-0.5 font-mono text-xs transition-colors md:px-2 md:py-1"
                        onClick={() => handleTimeInputApply(hint)}
                      >
                        {hint}
                      </button>
                    ))}
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-muted-foreground text-xs font-medium md:text-sm">
                    Type fixed times
                  </p>
                  <div className="flex flex-wrap gap-1 md:gap-1.5">
                    {["Jan 1", "Jan 1 - Jan 2", "1/1", "1/1 - 1/2"].map(
                      (hint) => (
                        <button
                          key={hint}
                          type="button"
                          className="bg-muted hover:bg-muted/70 rounded px-1.5 py-0.5 font-mono text-xs transition-colors md:px-2 md:py-1"
                          onClick={() => handleTimeInputApply(hint)}
                        >
                          {hint}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="order-last h-9 gap-2 px-3 font-normal md:order-none md:h-10 md:px-4"
            >
              <CalendarIcon className="h-4 w-4 shrink-0 opacity-50" />
              <span className="text-sm">
                {format(committedRange.from, "MMM d")}
                {" – "}
                {format(committedRange.to, "MMM d")}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex w-60 flex-col justify-center sm:w-full sm:flex-row">
              <Calendar
                mode="range"
                selected={calendarRange}
                onSelect={handleDateRangeSelect}
                numberOfMonths={1}
                disabled={{ after: new Date() }}
              />

              <div className="border-t px-3 pb-3">
                <div className="mt-3 space-y-2">
                  <p className="text-muted-foreground text-xs font-medium">
                    Start
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={startDateInput}
                      onChange={(e) => setStartDateInput(e.target.value)}
                      className="h-8 flex-1 text-sm"
                      placeholder="Feb 27, 2026"
                    />
                    <Input
                      value={startTimeInput}
                      onChange={(e) => setStartTimeInput(e.target.value)}
                      className="h-8 w-[70px] text-sm"
                      placeholder="00:00"
                    />
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <p className="text-muted-foreground text-xs font-medium">
                    End
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={endDateInput}
                      onChange={(e) => setEndDateInput(e.target.value)}
                      className="h-8 flex-1 text-sm"
                      placeholder="Mar 5, 2026"
                    />
                    <Input
                      value={endTimeInput}
                      onChange={(e) => setEndTimeInput(e.target.value)}
                      className="h-8 w-[70px] text-sm"
                      placeholder="23:59"
                    />
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 w-full text-sm"
                  onClick={handleManualApply}
                >
                  Apply ↵
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-9 gap-2 px-3 font-normal md:h-10 md:px-4"
              >
                <span className="text-sm">{statusLabel}</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="md:min-w-[180px]">
              {STATUS_OPTIONS.map((status) => (
                <DropdownMenuCheckboxItem
                  key={status.value}
                  checked={statusFilters.has(status.value)}
                  onCheckedChange={() => handleStatusToggle(status.value)}
                  className="md:py-2"
                >
                  {status.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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

      <UsageChart
        data={dailyVolume ?? []}
        days={days}
        isLoading={isDailyLoading}
      />

      <BandwidthSavingsCard
        totalOriginalSize={bandwidthSavings?.totalOriginalSize ?? 0}
        totalOptimizedSize={bandwidthSavings?.totalOptimizedSize ?? 0}
        bandwidthSaved={bandwidthSavings?.bandwidthSaved ?? 0}
        savingsPercentage={bandwidthSavings?.savingsPercentage ?? 0}
        isLoading={isBandwidthLoading}
      />

      <TopImagesList images={topImages ?? []} isLoading={isTopImagesLoading} />

      <RequestLogsTable logs={filteredLogs} isLoading={isLogsLoading} />
    </div>
  );
}
