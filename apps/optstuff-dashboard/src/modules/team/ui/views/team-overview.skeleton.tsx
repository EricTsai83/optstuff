import { MobileTabsSkeleton } from "../components/mobile-tabs.skeleton";
import { ProjectListSkeleton } from "../components/project-list.skeleton";
import { SearchToolbarSkeleton } from "../components/search-toolbar.skeleton";
import { UsageSidebarSkeleton } from "../components/usage-sidebar.skeleton";

export function TeamOverviewSkeleton() {
  return (
    <>
      <SearchToolbarSkeleton />
      <MobileTabsSkeleton />
      <div className="flex gap-8 pt-4">
        <UsageSidebarSkeleton />
        <ProjectListSkeleton />
      </div>
    </>
  );
}
