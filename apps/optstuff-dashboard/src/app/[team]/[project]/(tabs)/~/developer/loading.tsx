import { DeveloperTabSkeleton } from "@/modules/project-detail/ui/components/developer-tab.skeleton";

export default function DeveloperTabLoading() {
  return (
    <div role="status" aria-label="Loading developer tools" aria-busy="true">
      <DeveloperTabSkeleton />
    </div>
  );
}
