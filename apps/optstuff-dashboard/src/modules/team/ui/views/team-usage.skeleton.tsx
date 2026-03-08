import { UsageProgressBarSkeleton } from "@/components/usage-progress-bar";
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card";

export function TeamUsageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="px-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="bg-muted h-5 w-24 animate-pulse rounded" />
                {i <= 2 && (
                  <div className="bg-muted h-4 w-4 animate-pulse rounded" />
                )}
              </div>
              <div className="bg-muted mt-2 h-8 w-20 animate-pulse rounded sm:h-9" />
              <div className="bg-muted mt-1 h-4 w-16 animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="bg-muted h-5 w-36 animate-pulse rounded" />
          <div className="bg-muted h-4 w-64 animate-pulse rounded" />
        </CardHeader>
        <CardContent className="space-y-6">
          <UsageProgressBarSkeleton />
          <UsageProgressBarSkeleton />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="bg-muted h-5 w-36 animate-pulse rounded" />
          <div className="bg-muted h-4 w-72 animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="bg-muted h-4 w-28 animate-pulse rounded" />
                <div className="flex items-center gap-4">
                  <div className="bg-muted h-4 w-24 animate-pulse rounded" />
                  <div className="bg-muted h-4 w-16 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
