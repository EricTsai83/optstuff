import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

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
        <CardHeader className="p-0! flex flex-col items-stretch border-b sm:flex-row">
          <div className="sm:py-0! flex flex-1 flex-col justify-center gap-1 px-6 py-5">
            <CardTitle>Usage</CardTitle>
            <CardDescription>
              <div className="bg-muted h-4 w-20 animate-pulse rounded" />
            </CardDescription>
          </div>
          <div className="flex">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 even:border-l sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
              >
                {/* label: text-xs */}
                <div className="bg-muted h-3 w-16 animate-pulse rounded" />
                {/* value: text-lg sm:text-3xl font-bold leading-none */}
                <div className="bg-muted h-5 w-20 animate-pulse rounded sm:h-9" />
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:p-6">
          <div className="bg-muted h-[250px] animate-pulse rounded" />
        </CardContent>
      </Card>

      {/* Bandwidth savings */}
      <Card>
        <CardHeader>
          <CardTitle>Bandwidth Savings</CardTitle>
          <CardDescription>Original vs Optimized</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                {/* label: text-xs */}
                <div className="bg-muted h-3 w-16 animate-pulse rounded" />
                {/* value: text-xl sm:text-2xl font-bold */}
                <div className="bg-muted mt-1.5 h-7 w-16 animate-pulse rounded sm:h-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
