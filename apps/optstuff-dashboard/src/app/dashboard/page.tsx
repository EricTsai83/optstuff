import { db } from "@/server/db";
import { teams } from "@/server/db/schema";
import { auth } from "@workspace/auth/server";
import { and, asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

/**
 * Dashboard entry route.
 *
 * Acts as a stable entry point that redirects authenticated users to their
 * primary team workspace. This mirrors the common SaaS pattern where
 * `/dashboard` is used as the post-login landing URL.
 *
 * Redirect priority:
 * 1. Personal team (if exists)
 * 2. Oldest team owned by the user
 * 3. Onboarding (no teams yet)
 */
export default async function DashboardEntryPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
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
}
