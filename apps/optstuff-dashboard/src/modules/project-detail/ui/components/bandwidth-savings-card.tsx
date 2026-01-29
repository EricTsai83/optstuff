"use client";

import { formatBytes } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { ArrowDown, TrendingDown } from "lucide-react";

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
          <div className="bg-muted h-24 animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Original Size</p>
              <p className="text-2xl font-bold">
                {formatBytes(totalOriginalSize)}
              </p>
            </div>
            <ArrowDown className="text-muted-foreground h-6 w-6" />
            <div className="text-right">
              <p className="text-muted-foreground text-sm">Optimized Size</p>
              <p className="text-2xl font-bold">
                {formatBytes(totalOptimizedSize)}
              </p>
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-muted-foreground text-sm">Total Saved</p>
            <p className="text-3xl font-bold text-green-500">
              {formatBytes(Math.max(0, bandwidthSaved))}
            </p>
            <p className="text-muted-foreground text-sm">
              {Math.max(0, savingsPercentage)}% reduction
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
