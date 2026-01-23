import { redirect, notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { auth } from "@workspace/auth/server";
import { db } from "@/server/db";
import { teams } from "@/server/db/schema";
import { Header } from "@/components/header";
import { TeamContent } from "@/modules/team";
import { Footer } from "@/components/footer";

type PageProps = {
  params: Promise<{ team: string }>;
};

function renderTeamPage(team: typeof teams.$inferSelect) {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      <Header teamSlug={team.slug} />
      <TeamContent
        teamId={team.id}
        teamSlug={team.slug}
        teamName={team.name}
        isPersonal={team.isPersonal}
      />
      <Footer />
    </div>
  );
}

export default async function TeamPage({ params }: PageProps) {
  const { team: teamSlug } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Find team by slug and verify the user owns it
  const team = await db.query.teams.findFirst({
    where: eq(teams.slug, teamSlug),
  });

  if (team && team.ownerId === userId) {
    return renderTeamPage(team);
  }

  // Team not found or user doesn't own it
  // Check if user has any teams, if not, create a personal team
  const userTeams = await db.query.teams.findMany({
    where: eq(teams.ownerId, userId),
  });

  if (userTeams.length === 0) {
    // Create personal team for new user
    const personalSlug = `${userId.replace("user_", "")}-projects`;

    const [newTeam] = await db
      .insert(teams)
      .values({
        ownerId: userId,
        name: "Personal Team",
        slug: personalSlug,
        isPersonal: true,
      })
      .onConflictDoNothing()
      .returning();

    if (newTeam) {
      redirect(`/${newTeam.slug}`);
    }

    // If conflict, find the existing personal team
    const existingPersonalTeam = await db.query.teams.findFirst({
      where: and(eq(teams.ownerId, userId), eq(teams.isPersonal, true)),
    });

    if (existingPersonalTeam) {
      redirect(`/${existingPersonalTeam.slug}`);
    }
  }

  // User has teams but is trying to access one they don't own
  // Redirect to their first team (personal team should be first)
  const defaultTeam = userTeams.find((t) => t.isPersonal) ?? userTeams[0];
  if (defaultTeam) {
    redirect(`/${defaultTeam.slug}`);
  }

  // Shouldn't reach here, but just in case
  notFound();
}
