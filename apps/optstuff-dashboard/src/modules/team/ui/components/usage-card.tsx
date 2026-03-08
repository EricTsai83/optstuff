"use client";

import type { FormatType } from "@/components/usage-progress-bar";
import { UsageProgressBar } from "@/components/usage-progress-bar";
import { USAGE_LIMITS } from "@/lib/constants";
import { Button } from "@workspace/ui/components/button";
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
};

export function UsageCard({ totalRequests, totalBytes }: UsageCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // TODO: this should be fetched from the API
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

  const isCollapsible = usageData.length > 2;

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium">Usage</h3>
      <Card className={isCollapsible ? "relative" : undefined}>
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
          <div>
            <div className="space-y-3">
              {usageData.slice(0, 2).map((item) => (
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
            {isCollapsible && (
              <div
                className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                style={{
                  gridTemplateRows: isExpanded ? "1fr" : "0fr",
                }}
              >
                <div className="overflow-hidden">
                  <div className="mt-3 space-y-3">
                    {usageData.slice(2).map((item) => (
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
              </div>
            )}
          </div>
        </CardContent>
        {isCollapsible && (
          <Button
            variant="outline"
            size="sm"
            className="bg-card text-muted-foreground absolute -bottom-3 left-1/2 h-6 w-6 -translate-x-1/2 justify-center rounded-full transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-label={
              isExpanded ? "Collapse usage details" : "Expand usage details"
            }
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        )}
      </Card>
    </div>
  );
}
