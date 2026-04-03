import { OverviewTabSkeleton } from "@/modules/project-detail/ui/components/project-detail.skeleton";

export default function ProjectTabLoading() {
  return (
    <div role="status" aria-label="Loading tab content" aria-busy="true">
      <OverviewTabSkeleton />
    </div>
  );
}
