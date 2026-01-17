import { redirect, notFound } from "next/navigation";
import { auth } from "@workspace/auth/server";
import { db } from "@/server/db";
import { teams } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { Header } from "@/components/header";
import { TeamContent } from "@/components/team-content";
import { Footer } from "@/components/footer";

type PageProps = {
  params: Promise<{ team: string }>;
};

export default async function TeamPage({ params }: PageProps) {
  const { team: teamSlug } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Get team by slug
  const team = await db.query.teams.findFirst({
    where: and(eq(teams.slug, teamSlug), eq(teams.ownerId, userId)),
  });

  // If team not found, check if it's the first visit and we need to create personal team
  if (!team) {
    // Check if user has any teams
    const userTeams = await db.query.teams.findMany({
      where: eq(teams.ownerId, userId),
    });

    // If no teams at all, create personal team and redirect
    // Use atomic upsert to prevent race condition creating duplicate personal teams
    if (userTeams.length === 0) {
      // Try to insert, but do nothing if a personal team already exists (concurrent insert)
      const [insertedTeam] = await db
        .insert(teams)
        .values({
          ownerId: userId,
          name: "Personal Team",
          slug: `personal-${userId.toLowerCase().slice(0, 8)}-${Date.now()}`,
          isPersonal: true,
        })
        .onConflictDoNothing()
        .returning();

      // If insert succeeded, redirect to new team
      if (insertedTeam) {
        redirect(`/${insertedTeam.slug}`);
      }

      // If insert was skipped (conflict), fetch the existing personal team
      const existingPersonalTeam = await db.query.teams.findFirst({
        where: and(eq(teams.ownerId, userId), eq(teams.isPersonal, true)),
      });

      if (existingPersonalTeam) {
        redirect(`/${existingPersonalTeam.slug}`);
      }
    }

    // If user has teams but this slug doesn't exist, redirect to first team
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
