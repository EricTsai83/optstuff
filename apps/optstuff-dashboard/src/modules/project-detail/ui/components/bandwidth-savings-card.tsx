"use client";

import { formatBytes } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { TrendingDown, TrendingUp } from "lucide-react";

type BandwidthSavingsProps = {
  readonly totalOriginalSize: number;
  readonly totalOptimizedSize: number;
  readonly bandwidthSaved: number;
  readonly savingsPercentage: number;
  readonly pairedSizeSamples: number;
  readonly successfulRequests: number;
  readonly sampleCoveragePercentage: number;
  readonly isEstimated: boolean;
  readonly isLoading?: boolean;
};

export function BandwidthSavingsCard({
  totalOriginalSize,
  totalOptimizedSize,
  bandwidthSaved,
  savingsPercentage,
  pairedSizeSamples,
  successfulRequests,
  sampleCoveragePercentage,
  isEstimated,
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

  const isPositiveSavings = bandwidthSaved >= 0;
  const savingsClassName = isPositiveSavings ? "text-green-500" : "text-orange-500";
  const percentLabel = isPositiveSavings
    ? `${Math.max(0, savingsPercentage)}%`
    : `+${Math.abs(savingsPercentage)}%`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isPositiveSavings ? (
            <TrendingDown className={`h-5 w-5 ${savingsClassName}`} />
          ) : (
            <TrendingUp className={`h-5 w-5 ${savingsClassName}`} />
          )}
          Bandwidth Savings
        </CardTitle>
        <CardDescription>
          {isEstimated
            ? "Estimated from sampled successful requests"
            : "Original vs Optimized file sizes"}
        </CardDescription>
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
            <p className="text-muted-foreground text-xs">
              {isPositiveSavings ? "Total Saved" : "Total Increase"}
            </p>
            <p className={`text-xl font-bold tabular-nums sm:text-2xl ${savingsClassName}`}>
              {formatBytes(Math.abs(bandwidthSaved))}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">
              {isPositiveSavings ? "Reduction" : "Increase"}
            </p>
            <p className={`text-xl font-bold tabular-nums sm:text-2xl ${savingsClassName}`}>
              {percentLabel}
            </p>
          </div>
        </div>
        {isEstimated && (
          <p className="text-muted-foreground mt-3 text-xs">
            Coverage: {sampleCoveragePercentage}% ({pairedSizeSamples.toLocaleString()} /
            {" "}
            {successfulRequests.toLocaleString()} sampled successes include both original
            and optimized sizes)
          </p>
        )}
      </CardContent>
    </Card>
  );
}
