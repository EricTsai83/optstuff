import { redirect, notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@workspace/auth/server";
import { db } from "@/server/db";
import { teams } from "@/server/db/schema";
import { Header } from "@/components/header";
import { TeamContent } from "@/modules/team";
import { Footer } from "@/components/footer";
import { syncUserTeams } from "@/server/lib/team-sync";

type PageProps = {
  params: Promise<{ team: string }>;
};

export default async function TeamPage({ params }: PageProps) {
  const { team: teamSlug } = await params;
  const { userId, orgSlug } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Use session's orgSlug to verify access (no Clerk API call needed)
  if (orgSlug === teamSlug) {
    // User's active organization matches the URL - authorized
    const team = await db.query.teams.findFirst({
      where: eq(teams.slug, teamSlug),
    });

    if (team) {
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
  }

  // User's active org doesn't match URL or team not found locally
  // Try to sync from Clerk (for first-time users or missing local data)
  const syncedTeam = await syncUserTeams(db, userId);

  if (syncedTeam) {
    // Redirect to synced team
    redirect(`/${syncedTeam.slug}`);
  }

  // No team available
  notFound();
}
