import { getVerifiedTeam } from "@/lib/get-team";
import { TeamSettings } from "@/modules/team/ui/views/team-settings";

type PageProps = {
  params: Promise<{ team: string }>;
};

export default async function SettingsPage({ params }: PageProps) {
  const { team: teamSlug } = await params;
  const team = await getVerifiedTeam(teamSlug);

  return (
    <TeamSettings
      teamId={team.id}
      teamSlug={team.slug}
      teamName={team.name}
      isPersonal={team.isPersonal}
    />
  );
}
