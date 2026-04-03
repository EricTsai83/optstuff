"use client";

import { formatBytes, formatNumber } from "@/lib/format";
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
    <CardHeader className="p-0! flex flex-col items-stretch border-b sm:flex-row">
      <div className="sm:py-0! flex flex-1 flex-col justify-center gap-1 px-6 py-5">
        <CardTitle>Usage</CardTitle>
        <CardDescription>{periodLabel}</CardDescription>
      </div>
      {!isLoading && chartData.length > 0 && (
        <div className="flex">
          {(["requestCount", "bytesProcessed"] as const).map((key) => (
            <button
              key={key}
              data-active={activeMetric === key}
              className="data-[active=false]:text-muted-foreground data-[active=false]:hover:bg-muted/30 data-[active=true]:bg-muted/50 relative z-30 flex flex-1 cursor-pointer flex-col justify-center gap-1 border-t px-6 py-4 text-left transition-colors even:border-l data-[active=true]:shadow-[inset_0_-2px_0_0_var(--color-primary)] sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
              onClick={() => setActiveMetric(key)}
            >
              <span className="text-muted-foreground text-xs">
                {chartConfig[key].label}
              </span>
              <span className="text-lg font-bold leading-none sm:text-3xl">
                {key === "bytesProcessed"
                  ? formatBytes(totals[key])
                  : formatNumber(totals[key])}
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
