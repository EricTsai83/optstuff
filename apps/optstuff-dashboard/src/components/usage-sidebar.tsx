"use client";

import { ChevronDown, ChevronUp, Zap } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { useState } from "react";
import { Separator } from "@workspace/ui/components/separator";
import { api } from "@/trpc/react";

type UsageSidebarProps = {
  readonly teamId: string;
};

// Format bytes to human readable
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// Format number with K, M suffix
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

export function UsageSidebar({ teamId }: UsageSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: teamSummary, isLoading } = api.usage.getTeamSummary.useQuery(
    { teamId },
    { enabled: !!teamId },
  );

  // Define usage limits (could come from a plan/subscription in the future)
  const limits = {
    requests: 10000,
    bandwidth: 1024 * 1024 * 1024, // 1GB in bytes
  };

  const usageData = [
    {
      name: "API Requests",
      used: teamSummary?.totalRequests ?? 0,
      total: limits.requests,
      format: formatNumber,
    },
    {
      name: "Bandwidth",
      used: teamSummary?.totalBytes ?? 0,
      total: limits.bandwidth,
      format: formatBytes,
    },
  ];

  return (
    <div className="hidden w-80 shrink-0 space-y-6 md:block">
      {/* Usage section */}
      <div>
        <h3 className="mb-3 text-sm font-medium">Usage</h3>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-muted-foreground text-sm font-normal">
                Last 30 days
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="h-7 bg-transparent text-xs"
              >
                Upgrade
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-muted h-6 animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <>
                <div className="overflow-hidden">
                  <div
                    className="space-y-3 transition-[max-height] duration-300 ease-in-out"
                    style={{
                      maxHeight: isExpanded ? "1000px" : "80px",
                    }}
                  >
                    {usageData.map((item, index) => {
                      const percentage = Math.min(
                        (item.used / item.total) * 100,
                        100,
                      );
                      const isWarning = percentage > 80;
                      const isDanger = percentage > 95;

                      return (
                        <div key={index} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-2 w-2 rounded-full ${
                                  isDanger
                                    ? "bg-red-500"
                                    : isWarning
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                }`}
                              />
                              <span className="text-foreground">{item.name}</span>
                            </div>
                            <span className="text-muted-foreground">
                              {item.format(item.used)} / {item.format(item.total)}
                            </span>
                          </div>
                          <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isDanger
                                  ? "bg-red-500"
                                  : isWarning
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {usageData.length > 2 && (
                  <div className="relative flex justify-center">
                    <Separator className="absolute top-3 left-0 w-full" />
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-muted-foreground z-10 h-6 w-6 justify-center rounded-full transition-colors"
                      onClick={() => setIsExpanded(!isExpanded)}
                      aria-expanded={isExpanded}
                      aria-label={
                        isExpanded
                          ? "Collapse usage details"
                          : "Expand usage details"
                      }
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div>
        <h3 className="mb-3 text-sm font-medium">Quick Stats</h3>
        <Card>
          <CardContent className="grid grid-cols-2 gap-4 pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {teamSummary?.projectCount ?? 0}
              </div>
              <div className="text-muted-foreground text-xs">Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatNumber(teamSummary?.totalRequests ?? 0)}
              </div>
              <div className="text-muted-foreground text-xs">Requests</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="mb-3 text-sm font-medium">Get Started</h3>
        <Card>
          <CardContent className="space-y-3 pt-6 text-center">
            <div className="bg-primary/10 mx-auto flex h-10 w-10 items-center justify-center rounded-full">
              <Zap className="text-primary h-5 w-5" />
            </div>
            <h4 className="font-medium">Ready to optimize?</h4>
            <p className="text-muted-foreground text-sm">
              Create a project and generate an API key to start optimizing your images.
            </p>
            <Button variant="outline" className="w-full bg-transparent" asChild>
              <a
                href="https://docs.optstuff.dev"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Documentation
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
