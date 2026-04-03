import { UsageTabSkeleton } from "@/modules/project-detail/ui/components/usage-tab.skeleton";

export default function UsageTabLoading() {
  return (
    <div role="status" aria-label="Loading usage data" aria-busy="true">
      <UsageTabSkeleton />
    </div>
  );
}
