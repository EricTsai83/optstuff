"use client";

import {
  UsageProgressBar,
  UsageProgressBarSkeleton,
} from "@/components/usage-progress-bar";
import { DOCS_LINKS, USAGE_LIMITS } from "@/lib/constants";
import { formatBytes, formatNumber } from "@/lib/format";
import { api } from "@/trpc/react";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Separator } from "@workspace/ui/components/separator";
import { ChevronDown, ChevronUp, Zap } from "lucide-react";
import { useState } from "react";

type UsageSidebarProps = {
  readonly teamId: string;
};

export function UsageSidebar({ teamId }: UsageSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: teamSummary, isLoading } = api.usage.getTeamSummary.useQuery(
    { teamId },
    { enabled: !!teamId },
  );

  const usageData = [
    {
      name: "API Requests",
      used: teamSummary?.totalRequests ?? 0,
      total: USAGE_LIMITS.requests,
      format: formatNumber,
    },
    {
      name: "Bandwidth",
      used: teamSummary?.totalBytes ?? 0,
      total: USAGE_LIMITS.bandwidth,
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
                <UsageProgressBarSkeleton compact />
                <UsageProgressBarSkeleton compact />
              </div>
            ) : (
              <>
                <div className="overflow-hidden">
                  <div
                    className="space-y-3 transition-[max-height] duration-300 ease-in-out"
                    style={{ maxHeight: isExpanded ? "1000px" : "80px" }}
                  >
                    {usageData.map((item) => (
                      <UsageProgressBar
                        key={item.name}
                        label={item.name}
                        used={item.used}
                        total={item.total}
                        format={item.format}
                        compact
                      />
                    ))}
                  </div>
                </div>
                {usageData.length > 2 && (
                  <div className="relative flex justify-center">
                    <Separator className="absolute left-0 top-3 w-full" />
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
              Create a project and generate an API key to start optimizing your
              images.
            </p>
            <Button variant="outline" className="w-full bg-transparent" asChild>
              <a
                href={DOCS_LINKS.home}
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
