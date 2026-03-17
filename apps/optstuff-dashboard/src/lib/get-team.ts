import "server-only";

import { db } from "@/server/db";
import { teams } from "@/server/db/schema";
import { auth } from "@workspace/auth/server";
import { and, asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";

/**
 * Verify the current user owns the team identified by `slug`.
 * Redirects to sign-in, onboarding, or the user's default team as needed.
 */
// Cache the verifier per request so layouts and pages can share the same
// auth/database result without repeating the lookup for the same team slug.
export const getVerifiedTeam = cache(async (teamSlug: string) => {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const team = await db.query.teams.findFirst({
    where: and(eq(teams.slug, teamSlug), eq(teams.ownerId, userId)),
  });

  if (team) {
    return team;
  }

  const personalTeam = await db.query.teams.findFirst({
    where: and(eq(teams.ownerId, userId), eq(teams.isPersonal, true)),
    columns: { slug: true },
  });

  if (personalTeam) {
    redirect(`/${personalTeam.slug}`);
  }

  const fallbackTeam = await db.query.teams.findFirst({
    where: eq(teams.ownerId, userId),
    orderBy: asc(teams.createdAt),
    columns: { slug: true },
  });

  if (fallbackTeam) {
    redirect(`/${fallbackTeam.slug}`);
  }

  redirect("/onboarding");
});
