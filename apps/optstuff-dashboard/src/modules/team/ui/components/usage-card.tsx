"use client";

import {
  UsageProgressBar,
  UsageProgressBarSkeleton,
} from "@/components/usage-progress-bar";
import { USAGE_LIMITS } from "@/lib/constants";
import type { FormatType } from "@/components/usage-progress-bar";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

type UsageCardProps = {
  readonly totalRequests: number;
  readonly totalBytes: number;
  readonly isLoading: boolean;
};

export function UsageCard({
  totalRequests,
  totalBytes,
  isLoading,
}: UsageCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const usageData: {
    name: string;
    used: number;
    total: number;
    formatType: FormatType;
  }[] = [
    {
      name: "API Requests",
      used: totalRequests,
      total: USAGE_LIMITS.requests,
      formatType: "number",
    },
    {
      name: "Bandwidth",
      used: totalBytes,
      total: USAGE_LIMITS.bandwidth,
      formatType: "bytes",
    },
  ];

  return (
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
                      formatType={item.formatType}
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
  );
}
