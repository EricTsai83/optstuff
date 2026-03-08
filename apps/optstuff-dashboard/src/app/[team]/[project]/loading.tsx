import { HeaderSkeleton } from "@/components/header-skeleton";
import {
  ProjectDetailSkeleton,
  ProjectTabsSkeleton,
} from "@/modules/project-detail/ui/skeletons";

export default function ProjectLoading() {
  return (
    <div role="status" aria-label="Loading project page" aria-busy="true">
      <HeaderSkeleton />
      <ProjectTabsSkeleton />
      <ProjectDetailSkeleton />
    </div>
  );
}
