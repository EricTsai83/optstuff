import { getVerifiedTeam } from "@/lib/get-team";
import { TeamUsage } from "@/modules/team/ui/views/team-usage";

type PageProps = {
  params: Promise<{ team: string }>;
};

export default async function UsagePage({ params }: PageProps) {
  const { team: teamSlug } = await params;
  const team = await getVerifiedTeam(teamSlug);

  return <TeamUsage teamId={team.id} />;
}
