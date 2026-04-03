import { TeamSettingsSkeleton } from "@/modules/team";

export default function SettingsLoading() {
  return (
    <div role="status" aria-label="Loading settings" aria-busy="true">
      <TeamSettingsSkeleton />
    </div>
  );
}
