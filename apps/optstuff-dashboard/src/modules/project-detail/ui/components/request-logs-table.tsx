"use client";

import { formatBytes } from "@/lib/format";
import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { formatDistanceToNowStrict } from "date-fns";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Gauge,
  ShieldOff,
  Timer,
  XCircle,
} from "lucide-react";

type RequestLog = {
  id: string;
  sourceUrl: string;
  status: string;
  processingTimeMs: number | null;
  originalSize: number | null;
  optimizedSize: number | null;
  createdAt: Date;
};

type RequestLogsTableProps = {
  readonly logs: RequestLog[];
  readonly isLoading?: boolean;
};

const NO_BASELINE_SAVINGS = -1;

/**
 * Maps raw request status values to badge UI configuration.
 */
function getStatusConfig(status: string) {
  switch (status) {
    case "success":
      return {
        variant: "default" as const,
        icon: CheckCircle2,
        label: "Success",
        dotClass: "bg-emerald-500",
      };
    case "forbidden":
      return {
        variant: "secondary" as const,
        icon: ShieldOff,
        label: "Forbidden",
        dotClass: "bg-amber-500",
      };
    case "rate_limited":
      return {
        variant: "outline" as const,
        icon: Gauge,
        label: "Rate Limited",
        dotClass: "bg-orange-500",
      };
    case "error":
      return {
        variant: "destructive" as const,
        icon: XCircle,
        label: "Error",
        dotClass: "bg-red-500",
      };
    default:
      return {
        variant: "secondary" as const,
        icon: Clock,
        label: status,
        dotClass: "bg-gray-400",
      };
  }
}

/**
 * Calculates per-row savings percentage.
 * Returns `null` when size inputs are missing, `0` for no change,
 * and `NO_BASELINE_SAVINGS` when original size is zero.
 */
function getSavingsPercent(
  original: number | null,
  optimized: number | null,
): number | null {
  if (original == null || optimized == null) return null;
  if (original === optimized) return 0;
  if (original === 0) return NO_BASELINE_SAVINGS;
  return Math.round(((original - optimized) / original) * 100);
}

type StatusBadgeProps = {
  readonly status: string;
  readonly className?: string;
};

/**
 * Renders a standardized status badge for both mobile and desktop layouts.
 */
function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  return (
    <Badge
      variant={statusConfig.variant}
      className={["gap-1", className].filter(Boolean).join(" ")}
    >
      <StatusIcon className="h-3 w-3" />
      {statusConfig.label}
    </Badge>
  );
}

type RelativeTimeProps = {
  readonly createdAt: Date;
  readonly className?: string;
};

/**
 * Displays the relative timestamp for a log item.
 */
function RelativeTime({ createdAt, className }: RelativeTimeProps) {
  const relativeTimeText = formatDistanceToNowStrict(new Date(createdAt), {
    addSuffix: true,
  });

  return (
    <span className={className} title={relativeTimeText}>
      {relativeTimeText}
    </span>
  );
}

type ProcessingTimeDisplayProps = {
  readonly processingTimeMs: number | null;
  readonly variant: "mobile" | "desktop";
};

/**
 * Renders processing time with variant-specific fallback behavior.
 */
function ProcessingTimeDisplay({
  processingTimeMs,
  variant,
}: ProcessingTimeDisplayProps) {
  if (processingTimeMs == null) {
    if (variant === "desktop") {
      return <span className="text-muted-foreground/50 text-sm">—</span>;
    }
    return null;
  }

  const className =
    variant === "desktop"
      ? "inline-flex items-center gap-1 tabular-nums text-sm"
      : "inline-flex items-center gap-0.5 tabular-nums";

  return (
    <span className={className}>
      <Timer className="h-3 w-3" />
      {processingTimeMs}ms
    </span>
  );
}

type SizeSavingsDisplayProps = {
  readonly originalSize: number | null;
  readonly optimizedSize: number | null;
  readonly processingTimeMs: number | null;
  readonly variant: "mobile" | "desktop";
};

/**
 * Renders size and savings information consistently across mobile/desktop.
 */
function SizeSavingsDisplay({
  originalSize,
  optimizedSize,
  processingTimeMs,
  variant,
}: SizeSavingsDisplayProps) {
  const savings = getSavingsPercent(originalSize, optimizedSize);

  /**
   * Renders paired original/optimized size values with savings state styling.
   */
  const renderPairedSizes = (className: string) => {
    if (originalSize == null || optimizedSize == null) return null;

    return (
      <span className={className}>
        <span className={variant === "desktop" ? "text-muted-foreground" : ""}>
          {formatBytes(Number(originalSize))}
        </span>
        {savings != null && savings > 0 ? (
          <>
            <ArrowDownRight className="h-3 w-3 text-emerald-500" />
            <span>{formatBytes(Number(optimizedSize))}</span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              -{savings}%
            </span>
          </>
        ) : savings != null &&
          savings < 0 &&
          savings !== NO_BASELINE_SAVINGS ? (
          <>
            <ArrowUpRight className="h-3 w-3 text-orange-500" />
            <span>{formatBytes(Number(optimizedSize))}</span>
            <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
              +{Math.abs(savings)}%
            </span>
          </>
        ) : savings === NO_BASELINE_SAVINGS ? (
          <>
            <ArrowUpRight className="h-3 w-3 text-amber-500" />
            <span>{formatBytes(Number(optimizedSize))}</span>
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
              No baseline
            </span>
          </>
        ) : (
          <>
            <span className="mx-0.5">→</span>
            <span>{formatBytes(Number(optimizedSize))}</span>
            <span className="text-muted-foreground text-xs font-medium">
              0%
            </span>
          </>
        )}
      </span>
    );
  };

  /**
   * Builds desktop tooltip text from the current savings state.
   */
  const getDesktopTooltip = () => {
    if (originalSize == null || optimizedSize == null) return null;
    if (savings === NO_BASELINE_SAVINGS) {
      return "No baseline (original size is 0 B)";
    }
    if (savings != null && savings > 0) {
      return `Saved ${formatBytes(Number(originalSize) - Number(optimizedSize))}`;
    }
    if (savings != null && savings < 0) {
      return `Increased ${formatBytes(Number(optimizedSize) - Number(originalSize))}`;
    }
    return "No change";
  };

  if (variant === "mobile") {
    return (
      <>
        {originalSize != null && optimizedSize != null ? (
          renderPairedSizes("inline-flex items-center gap-1 tabular-nums")
        ) : optimizedSize != null ? (
          <span className="tabular-nums">
            {formatBytes(Number(optimizedSize))}
          </span>
        ) : null}
        <ProcessingTimeDisplay
          processingTimeMs={processingTimeMs}
          variant="mobile"
        />
      </>
    );
  }

  if (originalSize != null && optimizedSize != null) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {renderPairedSizes(
            "inline-flex items-center gap-1.5 text-sm tabular-nums",
          )}
        </TooltipTrigger>
        <TooltipContent>{getDesktopTooltip()}</TooltipContent>
      </Tooltip>
    );
  }

  if (optimizedSize != null) {
    return (
      <span className="text-muted-foreground text-sm tabular-nums">
        {formatBytes(Number(optimizedSize))}
      </span>
    );
  }

  return <span className="text-muted-foreground/50 text-sm">—</span>;
}

/**
 * Desktop table skeleton row shown while loading.
 */
function SkeletonRow() {
  return (
    <tr className="hidden md:table-row">
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-52" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-5 w-16" />
      </td>
      <td className="hidden px-4 py-3 lg:table-cell">
        <Skeleton className="h-4 w-12" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="px-4 py-3 text-right">
        <Skeleton className="ml-auto h-4 w-16" />
      </td>
    </tr>
  );
}

/**
 * Mobile skeleton card shown while loading.
 */
function MobileSkeletonCard() {
  return (
    <div className="border-border/30 border-b px-4 py-3 last:border-0 md:hidden">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="mt-2 flex items-center gap-3">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="ml-auto h-3.5 w-14" />
      </div>
    </div>
  );
}

/**
 * Mobile rendering for a single request log row.
 */
function MobileLogCard({ log }: { readonly log: RequestLog }) {
  return (
    <div className="border-border/30 hover:bg-muted/40 border-b px-4 py-3 transition-colors last:border-0 md:hidden">
      <div className="flex items-start justify-between gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="block min-w-0 flex-1 truncate text-left font-mono text-sm"
              aria-label={log.sourceUrl}
            >
              {log.sourceUrl}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-sm">
            <p className="break-all font-mono text-xs">{log.sourceUrl}</p>
          </TooltipContent>
        </Tooltip>
        <StatusBadge status={log.status} className="shrink-0" />
      </div>
      <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <SizeSavingsDisplay
          originalSize={log.originalSize}
          optimizedSize={log.optimizedSize}
          processingTimeMs={log.processingTimeMs}
          variant="mobile"
        />
        <RelativeTime
          createdAt={log.createdAt}
          className="ml-auto whitespace-nowrap"
        />
      </div>
    </div>
  );
}

/**
 * Responsive request logs table with mobile cards and desktop rows.
 */
export function RequestLogsTable({ logs, isLoading }: RequestLogsTableProps) {
  const columnHeaders = (
    <tr className="border-border/50 border-b text-left">
      <th className="text-muted-foreground px-4 py-2.5 text-xs font-medium tracking-wide">
        Source URL
      </th>
      <th className="text-muted-foreground w-28 whitespace-nowrap px-4 py-2.5 text-xs font-medium tracking-wide lg:w-32">
        Status
      </th>
      <th className="text-muted-foreground hidden w-24 whitespace-nowrap px-4 py-2.5 text-xs font-medium tracking-wide lg:table-cell">
        Time
      </th>
      <th className="text-muted-foreground w-40 whitespace-nowrap px-4 py-2.5 text-xs font-medium tracking-wide lg:w-48">
        Size
      </th>
      <th className="text-muted-foreground w-32 whitespace-nowrap px-4 py-2.5 text-right text-xs font-medium tracking-wide lg:w-36">
        When
      </th>
    </tr>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
          <CardDescription>Last 20 API requests</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          {/* Mobile skeleton */}
          <div className="md:hidden">
            {Array.from({ length: 5 }, (_, i) => (
              <MobileSkeletonCard key={i} />
            ))}
          </div>
          {/* Desktop skeleton */}
          <table className="hidden w-full table-fixed md:table">
            <thead>{columnHeaders}</thead>
            <tbody>
              {Array.from({ length: 5 }, (_, i) => (
                <SkeletonRow key={i} />
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Requests
          </CardTitle>
          <CardDescription>Last 20 API requests</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          {logs.length === 0 ? (
            <div className="text-muted-foreground py-12 text-center text-sm">
              No requests yet
            </div>
          ) : (
            <>
              {/* Mobile: card list */}
              <div className="md:hidden">
                {logs.map((log) => (
                  <MobileLogCard key={log.id} log={log} />
                ))}
              </div>

              {/* Desktop: table */}
              <table className="hidden w-full table-fixed md:table">
                <thead>{columnHeaders}</thead>
                <tbody>
                  {logs.map((log) => {
                    return (
                      <tr
                        key={log.id}
                        className="border-border/30 hover:bg-muted/40 border-b transition-colors last:border-0"
                      >
                        <td className="min-w-0 px-4 py-2.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="block w-full min-w-0 truncate text-left font-mono text-sm"
                                aria-label={log.sourceUrl}
                              >
                                {log.sourceUrl}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-sm">
                              <p className="break-all font-mono text-xs">
                                {log.sourceUrl}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </td>

                        <td className="w-28 whitespace-nowrap px-4 py-2.5 lg:w-32">
                          <StatusBadge
                            status={log.status}
                            className="whitespace-nowrap"
                          />
                        </td>

                        <td className="text-muted-foreground hidden px-4 py-2.5 lg:table-cell">
                          <ProcessingTimeDisplay
                            processingTimeMs={log.processingTimeMs}
                            variant="desktop"
                          />
                        </td>

                        <td className="w-40 px-4 py-2.5 lg:w-48">
                          <SizeSavingsDisplay
                            originalSize={log.originalSize}
                            optimizedSize={log.optimizedSize}
                            processingTimeMs={log.processingTimeMs}
                            variant="desktop"
                          />
                        </td>

                        <td className="text-muted-foreground w-32 whitespace-nowrap px-4 py-2.5 text-right text-sm lg:w-36">
                          <RelativeTime
                            createdAt={log.createdAt}
                            className="inline-block whitespace-nowrap"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
