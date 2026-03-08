export function TeamSwitcherSkeleton() {
  return (
    <div className="flex h-8 items-center gap-2 px-2">
      <div className="bg-muted h-5 w-5 animate-pulse rounded-full" />
      <div className="bg-muted h-4 w-24 animate-pulse rounded" />
    </div>
  );
}
