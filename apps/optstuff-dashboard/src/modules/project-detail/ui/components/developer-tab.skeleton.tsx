import { Card, CardContent, CardHeader } from "@workspace/ui/components/card";

export function DeveloperTabSkeleton() {
  return (
    <div className="space-y-6">
      {/* Quick Start editor */}
      <div className="flex overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-lg dark:border-white/[0.08] dark:bg-[#0a0a0a] dark:shadow-2xl">
        {/* Sidebar */}
        <div className="flex w-[140px] shrink-0 flex-col border-r border-black/[0.06] bg-[#f0f0f0] dark:border-white/[0.06] dark:bg-[#0e0e0e]">
          <div className="px-3 pb-2 pt-3">
            <div className="bg-muted h-3 w-12 animate-pulse rounded" />
          </div>
          <div className="flex flex-col gap-0.5 px-2 pb-2">
            <div className="bg-muted h-8 w-full animate-pulse rounded-md" />
            <div className="bg-muted/50 h-8 w-full animate-pulse rounded-md" />
          </div>
        </div>

        {/* Editor panel */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Title bar */}
          <div className="flex h-10 items-center border-b border-black/[0.06] bg-[#f6f6f6] px-4 dark:border-white/[0.06] dark:bg-[#0f0f0f]">
            <div className="flex gap-2">
              <div className="size-3 rounded-full bg-[#ff5f57]/40" />
              <div className="size-3 rounded-full bg-[#febc2e]/40" />
              <div className="size-3 rounded-full bg-[#28c840]/40" />
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex h-9 items-end border-b border-black/[0.06] bg-[#f6f6f6] px-2 dark:border-white/[0.06] dark:bg-[#0f0f0f]">
            {[16, 24, 20].map((w, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2">
                <div className="bg-muted size-2.5 animate-pulse rounded-sm" />
                <div
                  className="bg-muted h-3 animate-pulse rounded"
                  style={{ width: `${w * 4}px` }}
                />
              </div>
            ))}
          </div>

          {/* Code area */}
          <div className="h-[420px] space-y-2 bg-white p-4 dark:bg-[#0a0a0a]">
            {[0.85, 0.6, 0.3, 1, 0.7, 0.5, 0.9, 0.4, 0.75, 0.55].map((w, i) => (
              <div
                key={i}
                className="bg-muted h-4 animate-pulse rounded"
                style={{ width: `${w * 100}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* URL Tester card */}
      <Card>
        <CardHeader>
          <div className="bg-muted h-5 w-32 animate-pulse rounded" />
          <div className="bg-muted h-4 w-64 animate-pulse rounded" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Image URL */}
          <div className="space-y-2">
            <div className="bg-muted h-4 w-20 animate-pulse rounded" />
            <div className="bg-muted h-9 w-full animate-pulse rounded" />
          </div>
          {/* API Key + Format */}
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <div className="bg-muted h-4 w-16 animate-pulse rounded" />
                <div className="bg-muted h-9 w-full animate-pulse rounded" />
              </div>
            ))}
          </div>
          {/* Width + Quality */}
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <div className="bg-muted h-4 w-20 animate-pulse rounded" />
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
