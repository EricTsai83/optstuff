"use client";

import { formatBytesParts, formatNumberParts } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import { BarChart3 } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

type UsageData = {
  readonly date: string;
  readonly requestCount: number;
  readonly bytesProcessed: number;
};

type UsageChartProps = {
  readonly data: UsageData[];
  readonly days?: number;
  readonly isLoading?: boolean;
};

const chartConfig = {
  requestCount: {
    label: "Requests",
    color: "var(--chart-1)",
  },
  bytesProcessed: {
    label: "Bandwidth",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

type MetricKey = "requestCount" | "bytesProcessed";

export function UsageChart({ data, days = 30, isLoading }: UsageChartProps) {
  const [activeMetric, setActiveMetric] = useState<MetricKey>("requestCount");
  const periodLabel = `Last ${days} days`;

  const chartData = useMemo(
    () =>
      [...data]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((item) => ({ ...item })),
    [data],
  );

  const totals = useMemo(
    () => ({
      requestCount: data.reduce((sum, d) => sum + d.requestCount, 0),
      bytesProcessed: data.reduce((sum, d) => sum + d.bytesProcessed, 0),
    }),
    [data],
  );

  const headerContent = (
    <CardHeader className="[.border-b]:pb-0 flex flex-col items-stretch gap-1.5 border-b p-0 sm:flex-row">
      <div className="flex flex-1 flex-col justify-center gap-1.5 px-6 py-4">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Usage
        </CardTitle>
        <CardDescription>{periodLabel}</CardDescription>
      </div>
      {!isLoading && chartData.length > 0 && (
        <div className="flex">
          {(["requestCount", "bytesProcessed"] as const).map((key) => (
            <button
              key={key}
              data-active={activeMetric === key}
              className="data-[active=false]:text-muted-foreground data-[active=false]:hover:bg-muted/30 data-[active=true]:bg-muted/50 relative z-30 flex flex-1 cursor-pointer items-center justify-center border-t px-6 py-3 transition-colors even:border-l data-[active=true]:shadow-[inset_0_-2px_0_0_var(--color-primary)] sm:border-l sm:border-t-0 sm:px-8 sm:py-4"
              onClick={() => setActiveMetric(key)}
            >
              {(() => {
                const parts =
                  key === "bytesProcessed"
                    ? formatBytesParts(totals[key])
                    : formatNumberParts(totals[key]);
                return (
                  <span className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold leading-none sm:text-3xl">
                      {parts.value}
                    </span>
                    {parts.unit && (
                      <span className="text-sm font-medium sm:text-base">
                        {parts.unit}
                      </span>
                    )}
                  </span>
                );
              })()}
              <span className="text-muted-foreground absolute bottom-1 right-2 text-xs sm:bottom-1.5 sm:right-3">
                {chartConfig[key].label}
              </span>
            </button>
          ))}
        </div>
      )}
    </CardHeader>
  );

  if (isLoading) {
    return (
      <Card className="py-0 pb-4">
        {headerContent}
        <CardContent className="p-6">
          <div className="bg-muted h-[250px] animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="py-0 pb-4">
        {headerContent}
        <CardContent className="p-6">
          <div className="text-muted-foreground flex h-[250px] items-center justify-center text-sm">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="py-0 pb-4">
      {headerContent}
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value: string) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey={activeMetric}
                  labelFormatter={(value: string) =>
                    new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }
                />
              }
            />
            <Bar
              dataKey={activeMetric}
              fill={`var(--color-${activeMetric})`}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
