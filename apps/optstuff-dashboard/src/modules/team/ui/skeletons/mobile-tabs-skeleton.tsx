import { UsageProgressBarSkeleton } from "@/components/usage-progress-bar";

export function MobileTabsSkeleton() {
  return (
    <div className="flex flex-col gap-2 md:hidden">
      <div className="border-border inline-flex h-auto w-full items-center justify-start gap-0 rounded-none border-b bg-transparent p-0">
        <div className="flex flex-1 items-center justify-center gap-2 rounded-none border-b-2 border-transparent py-3 text-sm">
          <div className="bg-muted h-4 w-4 animate-pulse rounded" />
          <div className="bg-muted h-5 w-12 animate-pulse rounded" />
        </div>
        <div className="flex flex-1 items-center justify-center gap-2 rounded-none border-b-2 border-transparent py-3 text-sm">
          <div className="bg-muted h-4 w-4 animate-pulse rounded" />
          <div className="bg-muted h-5 w-20 animate-pulse rounded" />
        </div>
      </div>
      <div className="mt-0 flex-1 space-y-4 py-4">
        <UsageProgressBarSkeleton compact />
        <UsageProgressBarSkeleton compact />
      </div>
    </div>
  );
}
