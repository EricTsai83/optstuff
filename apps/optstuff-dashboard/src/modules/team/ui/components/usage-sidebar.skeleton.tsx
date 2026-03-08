import { UsageProgressBarSkeleton } from "@/components/usage-progress-bar";
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card";

export function UsageCardSkeleton() {
  return (
    <div>
      <h3 className="mb-3 text-sm font-medium">Usage</h3>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="bg-muted h-4 w-20 animate-pulse rounded" />
            <div className="bg-muted h-7 w-16 animate-pulse rounded" />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="space-y-3">
            <UsageProgressBarSkeleton compact />
            <UsageProgressBarSkeleton compact />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function QuickStatsSkeleton() {
  return (
    <div>
      <h3 className="mb-3 text-sm font-medium">Quick Stats</h3>
      <Card>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="bg-muted mx-auto h-8 w-8 animate-pulse rounded" />
            <div className="bg-muted mx-auto mt-0 h-4 w-14 animate-pulse rounded text-xs" />
          </div>
          <div className="text-center">
            <div className="bg-muted mx-auto h-8 w-10 animate-pulse rounded" />
            <div className="bg-muted mx-auto mt-0 h-4 w-16 animate-pulse rounded text-xs" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function GetStartedSkeleton() {
  return (
    <div>
      <h3 className="mb-3 text-sm font-medium">Get Started</h3>
      <Card>
        <CardContent className="space-y-3 pt-6 text-center">
          <div className="bg-muted mx-auto h-10 w-10 animate-pulse rounded-full" />
          <div className="bg-muted mx-auto h-6 w-36 animate-pulse rounded" />
          <div className="space-y-0 text-sm">
            <div className="bg-muted mx-auto h-5 w-full animate-pulse rounded" />
            <div className="bg-muted mx-auto h-5 w-4/5 animate-pulse rounded" />
          </div>
          <div className="bg-muted h-9 w-full animate-pulse rounded" />
        </CardContent>
      </Card>
    </div>
  );
}

export function UsageSidebarSkeleton() {
  return (
    <div className="hidden w-80 shrink-0 space-y-6 md:block">
      <UsageCardSkeleton />
      <QuickStatsSkeleton />
      <GetStartedSkeleton />
    </div>
  );
}
