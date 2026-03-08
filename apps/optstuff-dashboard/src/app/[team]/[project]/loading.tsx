import { HeaderSkeleton } from "@/components/header.skeleton";
import { ProjectDetailViewSkeleton } from "@/modules/project-detail";

export default function ProjectLoading() {
  return (
    <div role="status" aria-label="Loading project page" aria-busy="true">
      <HeaderSkeleton />
      <ProjectDetailViewSkeleton />
    </div>
  );
}
