function ProjectItemSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-lg p-3">
      <div className="bg-muted h-10 w-10 shrink-0 animate-pulse rounded-lg" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="bg-muted h-4 w-28 animate-pulse rounded" />
        <div className="bg-muted h-3.5 w-44 animate-pulse rounded" />
      </div>
      <div className="hidden items-center gap-3 md:flex">
        <div className="bg-muted h-4 w-8 animate-pulse rounded" />
        <div className="bg-muted h-4 w-10 animate-pulse rounded" />
      </div>
    </div>
  );
}

export function ProjectListSkeleton() {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium">Projects</h2>
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <ProjectItemSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
