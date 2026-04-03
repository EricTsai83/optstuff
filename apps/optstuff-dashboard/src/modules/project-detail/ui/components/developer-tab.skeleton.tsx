import { Card, CardContent, CardHeader } from "@workspace/ui/components/card";

export function DeveloperTabSkeleton() {
  return (
    <div className="space-y-6">
      {/* Quick Start snippets card */}
      <Card>
        <CardHeader>
          <div className="bg-muted h-5 w-40 animate-pulse rounded" />
          <div className="bg-muted h-4 w-72 animate-pulse rounded" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tab list */}
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-muted h-8 w-20 animate-pulse rounded"
              />
            ))}
          </div>
          {/* Code block */}
          <div className="bg-muted h-48 w-full animate-pulse rounded" />
        </CardContent>
      </Card>

      {/* URL Tester card */}
      <Card>
        <CardHeader>
          <div className="bg-muted h-5 w-32 animate-pulse rounded" />
          <div className="bg-muted h-4 w-64 animate-pulse rounded" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Image URL input */}
          <div className="space-y-2">
            <div className="bg-muted h-4 w-20 animate-pulse rounded" />
            <div className="bg-muted h-9 w-full animate-pulse rounded" />
          </div>
          {/* Width / Quality / Format controls */}
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="bg-muted h-4 w-16 animate-pulse rounded" />
                <div className="bg-muted h-9 w-full animate-pulse rounded" />
              </div>
            ))}
          </div>
          {/* Generate button */}
          <div className="bg-muted h-9 w-32 animate-pulse rounded" />
        </CardContent>
      </Card>
    </div>
  );
}
