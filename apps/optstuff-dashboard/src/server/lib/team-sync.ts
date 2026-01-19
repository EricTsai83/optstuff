import { eq, and } from "drizzle-orm";
import { clerkClient } from "@workspace/auth/server";
import type { db as dbType } from "@/server/db";
import { teams } from "@/server/db/schema";

type Team = typeof teams.$inferSelect;

/**
 * Sync Clerk organizations to local database and ensure user has a personal team.
 * Returns the team to redirect to, or null if no action needed.
 */
export async function syncUserTeams(
  db: typeof dbType,
  userId: string,
): Promise<Team | null> {
  const client = await clerkClient();

  // Check if user already has organizations in Clerk
  const clerkMemberships = await client.users.getOrganizationMembershipList({
    userId,
  });

  if (clerkMemberships.data.length > 0) {
    // User has Clerk orgs - sync all to local DB
    for (const membership of clerkMemberships.data) {
      const org = membership.organization;
      await db
        .insert(teams)
        .values({
          ownerId: userId,
          clerkOrgId: org.id,
          name: org.name,
          slug: org.slug!,
          isPersonal: false,
        })
        .onConflictDoNothing();
    }

    // Return the first org for redirect
    const firstOrg = clerkMemberships.data[0]!.organization;
    const syncedTeam = await db.query.teams.findFirst({
      where: eq(teams.clerkOrgId, firstOrg.id),
    });
    return syncedTeam ?? null;
  }

  // No Clerk orgs - create personal team
  const user = await client.users.getUser(userId);
  const username =
    user.username ?? user.emailAddresses[0]?.emailAddress?.split("@")[0];

  const personalSlug = username
    ? `${username.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-personal-team`
    : `${userId.replace("user_", "")}-personal-team`;

  const org = await client.organizations.createOrganization({
    name: "Personal Team",
    slug: personalSlug,
    createdBy: userId,
  });

  const [newTeam] = await db
    .insert(teams)
    .values({
      ownerId: userId,
      clerkOrgId: org.id,
      name: "Personal Team",
      slug: org.slug!,
      isPersonal: true,
    })
    .onConflictDoNothing()
    .returning();

  if (newTeam) return newTeam;

  // If conflict, find existing personal team
  return (
    (await db.query.teams.findFirst({
      where: and(eq(teams.ownerId, userId), eq(teams.isPersonal, true)),
    })) ?? null
  );
}
