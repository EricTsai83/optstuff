import {
  MobileTabsSkeleton,
  ProjectListSkeleton,
  SearchToolbarSkeleton,
  UsageSidebarSkeleton,
} from "@/modules/team/ui/skeletons";

export default function TeamOverviewLoading() {
  return (
    <div role="status" aria-label="Loading team overview" aria-busy="true">
      <SearchToolbarSkeleton />
      <MobileTabsSkeleton />
      <div className="flex gap-8 pt-4">
        <UsageSidebarSkeleton />
        <ProjectListSkeleton />
      </div>
    </div>
  );
}
