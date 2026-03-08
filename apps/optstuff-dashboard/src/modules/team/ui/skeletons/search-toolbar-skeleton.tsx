export function SearchToolbarSkeleton() {
  return (
    <div className="flex items-center gap-2 py-4">
      <div className="bg-muted h-10 flex-1 animate-pulse rounded" />
      <div className="bg-muted h-10 w-28 animate-pulse rounded" />
    </div>
  );
}
