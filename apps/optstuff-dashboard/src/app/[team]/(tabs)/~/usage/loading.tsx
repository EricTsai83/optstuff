import { TeamUsageSkeleton } from "@/modules/team";

export default function UsageLoading() {
  return (
    <div role="status" aria-label="Loading usage data" aria-busy="true">
      <TeamUsageSkeleton />
    </div>
  );
}
