import "server-only";

import { db } from "@/server/db";
import { teams } from "@/server/db/schema";
import { auth } from "@workspace/auth/server";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

/**
 * Verify the current user owns the team identified by `slug`.
 * Redirects to sign-in, onboarding, or the user's default team as needed.
 */
export async function getVerifiedTeam(teamSlug: string) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const team = await db.query.teams.findFirst({
    where: eq(teams.slug, teamSlug),
  });

  if (team?.ownerId === userId) {
    return team;
  }

  const userTeams = await db.query.teams.findMany({
    where: eq(teams.ownerId, userId),
  });

  if (userTeams.length === 0) {
    redirect("/onboarding");
  }

  const defaultTeam = userTeams.find((t) => t.isPersonal) ?? userTeams[0];
  if (defaultTeam) {
    redirect(`/${defaultTeam.slug}`);
  }

  notFound();
}
