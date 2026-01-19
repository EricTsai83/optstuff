import { redirect, notFound } from "next/navigation";
import { auth } from "@workspace/auth/server";
import { db } from "@/server/db";
import { Header } from "@/components/header";
import { TeamContent } from "@/modules/team";
import { Footer } from "@/components/footer";
import { checkTeamAccessBySlug, getUserTeams } from "@/server/lib/team-access";
import { syncUserTeams } from "@/server/lib/team-sync";

type PageProps = {
  params: Promise<{ team: string }>;
};

export default async function TeamPage({ params }: PageProps) {
  const { team: teamSlug } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Check team access via Clerk membership
  const { hasAccess, team } = await checkTeamAccessBySlug(db, teamSlug, userId);

  // If team not found or no access, check if it's the first visit
  if (!hasAccess || !team) {
    // Get all teams user has access to via Clerk
    const userTeams = await getUserTeams(db, userId);

    // If no local teams, sync from Clerk or create personal team
    if (userTeams.length === 0) {
      const syncedTeam = await syncUserTeams(db, userId);
      if (syncedTeam) {
        redirect(`/${syncedTeam.slug}`);
      }
    }

    // If user has teams but this slug doesn't exist or no access, redirect to first team
    if (userTeams.length > 0) {
      const personalTeam = userTeams.find((t) => t.isPersonal) ?? userTeams[0];
      if (personalTeam && teamSlug !== personalTeam.slug) {
        redirect(`/${personalTeam.slug}`);
      }
    }

    notFound();
  }

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <Header teamSlug={teamSlug} />
      <TeamContent
        teamId={team.id}
        teamSlug={teamSlug}
        teamName={team.name}
        isPersonal={team.isPersonal}
      />
      <Footer />
    </div>
  );
}
