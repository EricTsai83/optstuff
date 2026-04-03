import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { BarChart3, Clock, ImageIcon, PiggyBank } from "lucide-react";

export function StatCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardContent className="px-4 sm:px-6">
            <div className="flex items-center justify-between">
              {/* title: text-sm font-medium */}
              <div className="bg-muted h-3.5 w-24 animate-pulse rounded" />
              {/* icon */}
              <div className="bg-muted h-4 w-4 animate-pulse rounded" />
            </div>
            {/* value: text-2xl sm:text-3xl font-bold */}
            <div className="bg-muted mt-2 h-8 w-20 animate-pulse rounded sm:h-9" />
            {/* subtitle: text-xs */}
            <div className="bg-muted mt-1 h-4 w-32 animate-pulse rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function UsageTabSkeleton() {
  return (
    <div className="space-y-8">
      {/* Filter bar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 md:flex-nowrap md:gap-3">
          {/* TimePresetPicker */}
          <div className="bg-muted h-9 w-[140px] animate-pulse rounded-md md:h-10" />
          {/* DateRangeCalendarPicker */}
          <div className="bg-muted md:order-0 order-last h-9 w-[170px] animate-pulse rounded-md md:h-10" />
          {/* StatusFilterDropdown */}
          <div className="bg-muted ml-auto h-9 w-[120px] animate-pulse rounded-md md:h-10" />
        </div>
      </div>

      {/* Sync panel */}
      <div className="flex justify-end">
        <div className="bg-muted h-5 w-40 animate-pulse rounded" />
      </div>

      <StatCardsSkeleton />

      {/* Usage chart */}
      <Card className="py-0 pb-4">
        <CardHeader className="[.border-b]:pb-0 flex flex-col items-stretch gap-1.5 border-b p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-2 px-6 py-4">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Usage
            </CardTitle>
            <div className="bg-muted h-3.5 w-16 animate-pulse rounded" />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="bg-muted h-[250px] animate-pulse rounded" />
        </CardContent>
      </Card>

      {/* Bandwidth savings */}
      <Card className="gap-4 py-4">
        <CardHeader className="[.border-b]:pb-4 gap-1.5 border-b">
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5" />
            Bandwidth Savings
          </CardTitle>
          <CardDescription>Original vs Optimized</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted h-16 animate-pulse rounded" />
        </CardContent>
      </Card>

      {/* Top images */}
      <Card className="gap-4 py-4">
        <CardHeader className="[.border-b]:pb-4 gap-1.5 border-b">
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Top Images
          </CardTitle>
          <CardDescription>Most requested images</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          <div>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="border-border/30 flex items-center gap-3 border-b px-4 py-2.5 last:border-0"
              >
                <div className="bg-muted h-4 w-4 animate-pulse rounded" />
                <div className="bg-muted h-4 w-48 animate-pulse rounded" />
                <div className="bg-muted ml-auto h-4 w-20 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent requests */}
      <Card className="gap-4 py-4">
        <CardHeader className="[.border-b]:pb-4 gap-1.5 border-b">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Requests
          </CardTitle>
          <CardDescription>Last 20 API requests</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          {/* Mobile skeleton */}
          <div className="md:hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="border-border/30 border-b px-4 py-3 last:border-0"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3.5 w-16" />
                  <Skeleton className="ml-auto h-3.5 w-14" />
                </div>
              </div>
            ))}
          </div>
          {/* Desktop skeleton */}
          <table className="hidden w-full table-fixed md:table">
            <thead>
              <tr className="border-border/50 border-b text-left">
                <th className="text-muted-foreground px-4 py-2.5 text-xs font-medium tracking-wide">
                  Source URL
                </th>
                <th className="text-muted-foreground hidden w-36 whitespace-nowrap px-4 py-2.5 text-xs font-medium tracking-wide xl:table-cell">
                  Operations
                </th>
                <th className="text-muted-foreground w-28 whitespace-nowrap px-4 py-2.5 text-xs font-medium tracking-wide lg:w-32">
                  Status
                </th>
                <th className="text-muted-foreground hidden w-24 whitespace-nowrap px-4 py-2.5 text-xs font-medium tracking-wide lg:table-cell">
                  Time
                </th>
                <th className="text-muted-foreground w-40 whitespace-nowrap px-4 py-2.5 text-xs font-medium tracking-wide lg:w-48">
                  Size
                </th>
                <th className="text-muted-foreground w-32 whitespace-nowrap px-4 py-2.5 text-right text-xs font-medium tracking-wide lg:w-36">
                  When
                </th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-52" />
                  </td>
                  <td className="hidden px-4 py-3 xl:table-cell">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-5 w-16" />
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <Skeleton className="h-4 w-12" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Skeleton className="ml-auto h-4 w-16" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
