import { getVerifiedTeam } from "@/lib/get-team";
import { TeamOverview } from "@/modules/team/ui/views/team-overview";

type PageProps = {
  params: Promise<{ team: string }>;
};

export default async function TeamOverviewPage({ params }: PageProps) {
  const { team: teamSlug } = await params;
  const team = await getVerifiedTeam(teamSlug);

  return <TeamOverview teamId={team.id} teamSlug={team.slug} />;
}
