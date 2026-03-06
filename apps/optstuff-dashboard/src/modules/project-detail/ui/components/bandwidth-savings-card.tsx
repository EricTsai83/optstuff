"use client";

import { formatBytes } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { TrendingDown } from "lucide-react";

type BandwidthSavingsProps = {
  readonly totalOriginalSize: number;
  readonly totalOptimizedSize: number;
  readonly bandwidthSaved: number;
  readonly savingsPercentage: number;
  readonly isLoading?: boolean;
};

export function BandwidthSavingsCard({
  totalOriginalSize,
  totalOptimizedSize,
  bandwidthSaved,
  savingsPercentage,
  isLoading,
}: BandwidthSavingsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bandwidth Savings</CardTitle>
          <CardDescription>Original vs Optimized</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted h-16 animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  const clampedPercentage = Math.min(100, Math.max(0, savingsPercentage));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-green-500" />
          Bandwidth Savings
        </CardTitle>
        <CardDescription>Original vs Optimized file sizes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-muted-foreground text-xs">Original</p>
            <p className="text-xl font-bold tabular-nums sm:text-2xl">
              {formatBytes(totalOriginalSize)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Optimized</p>
            <p className="text-xl font-bold tabular-nums sm:text-2xl">
              {formatBytes(totalOptimizedSize)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Total Saved</p>
            <p className="text-xl font-bold tabular-nums text-green-500 sm:text-2xl">
              {formatBytes(Math.max(0, bandwidthSaved))}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Reduction</p>
            <p className="text-xl font-bold tabular-nums text-green-500 sm:text-2xl">
              {clampedPercentage}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
