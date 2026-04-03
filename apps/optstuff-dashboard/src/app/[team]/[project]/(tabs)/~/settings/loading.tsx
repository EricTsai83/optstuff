import { SettingsTabSkeleton } from "@/modules/project-detail/ui/components/settings-tab.skeleton";

export default function SettingsTabLoading() {
  return (
    <div role="status" aria-label="Loading settings" aria-busy="true">
      <SettingsTabSkeleton />
    </div>
  );
}
