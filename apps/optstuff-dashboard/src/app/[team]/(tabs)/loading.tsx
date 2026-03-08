import { TeamOverviewSkeleton } from "@/modules/team";

export default function TeamOverviewLoading() {
  return (
    <div role="status" aria-label="Loading team overview" aria-busy="true">
      <TeamOverviewSkeleton />
    </div>
  );
}
