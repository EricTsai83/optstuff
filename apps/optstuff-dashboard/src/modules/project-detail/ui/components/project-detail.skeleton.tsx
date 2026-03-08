function ProjectHeaderSkeleton() {
  return (
    <div className="mb-8">
      <div className="bg-muted mb-4 h-4 w-36 animate-pulse rounded" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="bg-muted h-9 w-56 animate-pulse rounded" />
        <div className="flex flex-wrap gap-2">
          <div className="bg-muted h-9 w-28 animate-pulse rounded" />
          <div className="bg-muted h-9 w-24 animate-pulse rounded" />
          <div className="bg-muted h-9 w-20 animate-pulse rounded" />
        </div>
      </div>
      <div className="bg-muted mt-2 h-5 w-96 max-w-full animate-pulse rounded" />
    </div>
  );
}

function OverviewTabSkeleton() {
  return (
    <div className="space-y-6">
      <div className="border-border rounded-lg border p-6">
        <div className="mb-3 space-y-2">
          <div className="bg-muted h-5 w-28 animate-pulse rounded" />
          <div className="bg-muted h-4 w-64 animate-pulse rounded" />
        </div>
        <div className="bg-muted h-12 w-full animate-pulse rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border-border rounded-lg border p-4">
            <div className="bg-muted mb-2 h-4 w-20 animate-pulse rounded" />
            <div className="bg-muted h-7 w-16 animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProjectDetailSkeleton() {
  return (
    <main className="container mx-auto flex-1 px-4 py-6">
      <ProjectHeaderSkeleton />
      <OverviewTabSkeleton />
    </main>
  );
}
