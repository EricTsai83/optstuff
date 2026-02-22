"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

type StatCardProps = {
  readonly title: string;
  readonly value: string;
  readonly subtitle?: string;
  readonly icon?: React.ReactNode;
};

export function StatCard({ title, value, subtitle, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between px-3 pb-1 sm:px-6 sm:pb-2">
        <CardTitle>{title}</CardTitle>
        {icon && <span className="hidden sm:inline">{icon}</span>}
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        <div className="truncate text-lg font-bold sm:text-2xl">{value}</div>
        {subtitle && (
          <p className="text-muted-foreground hidden text-xs sm:block">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
