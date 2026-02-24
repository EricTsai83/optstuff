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
import { formatDistanceToNow } from "date-fns";
import {
  ArrowDownRight,
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

function getSavingsPercent(
  original: number | null,
  optimized: number | null,
): number | null {
  if (!original || !optimized || original === 0) return null;
  return Math.round(((original - optimized) / original) * 100);
}

function SkeletonRow() {
  return (
    <tr>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-52" />
      </td>
      <td className="hidden px-4 py-3 md:table-cell">
        <Skeleton className="h-5 w-16" />
      </td>
      <td className="hidden px-4 py-3 lg:table-cell">
        <Skeleton className="h-4 w-12" />
      </td>
      <td className="hidden px-4 py-3 sm:table-cell">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="px-4 py-3 text-right">
        <Skeleton className="ml-auto h-4 w-16" />
      </td>
    </tr>
  );
}

export function RequestLogsTable({ logs, isLoading }: RequestLogsTableProps) {
  const columnHeaders = (
    <tr className="border-border/50 border-b text-left">
      <th className="text-muted-foreground px-4 py-2.5 text-xs font-medium tracking-wide">
        Source URL
      </th>
      <th className="text-muted-foreground hidden px-4 py-2.5 text-xs font-medium tracking-wide md:table-cell">
        Status
      </th>
      <th className="text-muted-foreground hidden px-4 py-2.5 text-xs font-medium tracking-wide lg:table-cell">
        Time
      </th>
      <th className="text-muted-foreground hidden px-4 py-2.5 text-xs font-medium tracking-wide sm:table-cell">
        Size
      </th>
      <th className="text-muted-foreground px-4 py-2.5 text-right text-xs font-medium tracking-wide">
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
          <table className="w-full">
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
            <table className="w-full">
              <thead>{columnHeaders}</thead>
              <tbody>
                {logs.map((log) => {
                  const statusConfig = getStatusConfig(log.status);
                  const savings = getSavingsPercent(
                    log.originalSize,
                    log.optimizedSize,
                  );

                  return (
                    <tr
                      key={log.id}
                      className="border-border/30 hover:bg-muted/40 border-b transition-colors last:border-0"
                    >
                      <td className="max-w-[280px] px-4 py-2.5">
                        <div className="flex items-center gap-2 md:hidden">
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusConfig.dotClass}`}
                          />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="block truncate font-mono text-sm">
                                {log.sourceUrl}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-sm">
                              <p className="break-all font-mono text-xs">
                                {log.sourceUrl}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="hidden md:block">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="block truncate font-mono text-sm">
                                {log.sourceUrl}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-sm">
                              <p className="break-all font-mono text-xs">
                                {log.sourceUrl}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </td>

                      <td className="hidden px-4 py-2.5 md:table-cell">
                        <Badge
                          variant={statusConfig.variant}
                          className="gap-1"
                        >
                          <statusConfig.icon className="h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                      </td>

                      <td className="text-muted-foreground hidden px-4 py-2.5 lg:table-cell">
                        {log.processingTimeMs != null ? (
                          <span className="inline-flex items-center gap-1 tabular-nums text-sm">
                            <Timer className="h-3 w-3" />
                            {log.processingTimeMs}ms
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50 text-sm">
                            —
                          </span>
                        )}
                      </td>

                      <td className="hidden px-4 py-2.5 sm:table-cell">
                        {log.originalSize && log.optimizedSize ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1.5 text-sm tabular-nums">
                                <span className="text-muted-foreground">
                                  {formatBytes(Number(log.originalSize))}
                                </span>
                                <ArrowDownRight className="text-emerald-500 h-3 w-3" />
                                <span>
                                  {formatBytes(Number(log.optimizedSize))}
                                </span>
                                {savings != null && savings > 0 && (
                                  <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                                    -{savings}%
                                  </span>
                                )}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              Saved{" "}
                              {formatBytes(
                                Number(log.originalSize) -
                                  Number(log.optimizedSize),
                              )}
                            </TooltipContent>
                          </Tooltip>
                        ) : log.optimizedSize ? (
                          <span className="text-muted-foreground text-sm tabular-nums">
                            {formatBytes(Number(log.optimizedSize))}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50 text-sm">
                            —
                          </span>
                        )}
                      </td>

                      <td className="text-muted-foreground px-4 py-2.5 text-right text-sm whitespace-nowrap">
                        {formatDistanceToNow(new Date(log.createdAt), {
                          addSuffix: true,
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
