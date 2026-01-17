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
  readonly subtitle: string;
  readonly icon?: React.ReactNode;
};

export function StatCard({ title, value, subtitle, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-muted-foreground text-xs">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
