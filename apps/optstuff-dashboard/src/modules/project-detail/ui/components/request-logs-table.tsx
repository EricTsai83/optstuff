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
import { formatDistanceToNow } from "date-fns";
import { Clock } from "lucide-react";

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

function getStatusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" {
  switch (status) {
    case "success":
      return "default";
    case "forbidden":
      return "secondary";
    case "error":
      return "destructive";
    default:
      return "secondary";
  }
}

function truncateUrl(url: string, maxLength = 40): string {
  if (url.length <= maxLength) return url;
  return `${url.slice(0, maxLength - 3)}...`;
}

export function RequestLogsTable({ logs, isLoading }: RequestLogsTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
          <CardDescription>Last 20 API requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-muted h-12 animate-pulse rounded-lg"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Requests
        </CardTitle>
        <CardDescription>Last 20 API requests</CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center text-sm">
            No requests yet
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="bg-muted/50 flex items-center justify-between rounded-lg px-4 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate font-mono text-sm"
                    title={log.sourceUrl}
                  >
                    {truncateUrl(log.sourceUrl)}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(log.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {log.processingTimeMs && (
                    <span className="text-muted-foreground text-xs">
                      {log.processingTimeMs}ms
                    </span>
                  )}
                  {log.optimizedSize && (
                    <span className="text-muted-foreground text-xs">
                      {formatBytes(Number(log.optimizedSize))}
                    </span>
                  )}
                  <Badge variant={getStatusBadgeVariant(log.status)}>
                    {log.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
