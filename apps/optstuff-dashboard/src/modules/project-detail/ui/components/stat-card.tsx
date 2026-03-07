"use client";

import { Card, CardContent } from "@workspace/ui/components/card";
import { cn } from "@workspace/ui/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";

type StatCardProps = {
  readonly title: string;
  readonly value: string;
  readonly subtitle?: string;
  readonly icon?: React.ReactNode;
  readonly trend?: {
    readonly value: number;
    readonly label: string;
  };
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          {icon && <div className="text-muted-foreground/60">{icon}</div>}
        </div>
        <div className="mt-2 truncate text-2xl font-bold tracking-tight sm:text-3xl">
          {value}
        </div>
        {trend != null && trend.value !== 0 && (
          <p
            className={cn(
              "mt-1 flex items-center gap-1 text-xs font-medium",
              trend.value > 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400",
            )}
          >
            {trend.value > 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend.value > 0 ? "+" : ""}
            {trend.value}% {trend.label}
          </p>
        )}
        {subtitle && (
          <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
