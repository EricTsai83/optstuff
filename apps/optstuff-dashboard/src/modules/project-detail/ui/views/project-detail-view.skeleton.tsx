import { ProjectDetailSkeleton } from "../components/project-detail.skeleton";
import { ProjectTabsSkeleton } from "../components/project-tabs.skeleton";

export function ProjectDetailViewSkeleton() {
  return (
    <>
      <ProjectTabsSkeleton />
      <ProjectDetailSkeleton />
    </>
  );
}
