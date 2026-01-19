import { eq } from "drizzle-orm";

import { clerkClient } from "@workspace/auth/server";
import type { db as dbType } from "@/server/db";
import { teams, projects } from "@/server/db/schema";

export type OrgRole = "org:admin" | "org:member";

type Team = typeof teams.$inferSelect;
type Project = typeof projects.$inferSelect;

type TeamAccessResult = { hasAccess: boolean; team: Team | null; role: string | null };

/**
 * Check if a user is a member of a Clerk Organization.
 * Uses Clerk API to verify membership.
 */
export async function checkOrgMembership(
  clerkOrgId: string,
  userId: string,
  requiredRoles?: OrgRole[],
): Promise<{ isMember: boolean; role: string | null }> {
  const client = await clerkClient();
  try {
    const memberships =
      await client.organizations.getOrganizationMembershipList({
        organizationId: clerkOrgId,
      });

    const membership = memberships.data.find(
      (m) => m.publicUserData?.userId === userId,
    );
    if (!membership) {
      return { isMember: false, role: null };
    }

    const role = membership.role;
    if (requiredRoles && !requiredRoles.includes(role as OrgRole)) {
      return { isMember: false, role };
    }
    return { isMember: true, role };
  } catch {
    return { isMember: false, role: null };
  }
}

/**
 * Internal helper to check team access after finding the team.
 */
async function verifyTeamAccess(
  team: Team | undefined,
  userId: string,
  requiredRoles?: OrgRole[],
): Promise<TeamAccessResult> {
  if (!team) {
    return { hasAccess: false, team: null, role: null };
  }

  const { isMember, role } = await checkOrgMembership(
    team.clerkOrgId,
    userId,
    requiredRoles,
  );

  return {
    hasAccess: isMember,
    team: isMember ? team : null,
    role,
  };
}

/**
 * Check if a user has access to a team by team ID.
 * Queries local DB for team, then verifies Clerk membership.
 */
export async function checkTeamAccess(
  db: typeof dbType,
  teamId: string,
  userId: string,
  requiredRoles?: OrgRole[],
): Promise<TeamAccessResult> {
  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
  });
  return verifyTeamAccess(team, userId, requiredRoles);
}

/**
 * Check if a user has access to a team by team slug.
 * Queries local DB for team, then verifies Clerk membership.
 */
export async function checkTeamAccessBySlug(
  db: typeof dbType,
  teamSlug: string,
  userId: string,
  requiredRoles?: OrgRole[],
): Promise<TeamAccessResult> {
  const team = await db.query.teams.findFirst({
    where: eq(teams.slug, teamSlug),
  });
  return verifyTeamAccess(team, userId, requiredRoles);
}

/**
 * Check if a user has access to a project by project ID.
 * Queries local DB for project and its team, then verifies Clerk membership.
 */
export async function checkProjectAccess(
  db: typeof dbType,
  projectId: string,
  userId: string,
  requiredRoles?: OrgRole[],
): Promise<{
  hasAccess: boolean;
  project: (Project & { team: Team }) | null;
  role: string | null;
}> {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: { team: true },
  });

  if (!project) {
    return { hasAccess: false, project: null, role: null };
  }

  const { isMember, role } = await checkOrgMembership(
    project.team.clerkOrgId,
    userId,
    requiredRoles,
  );

  return {
    hasAccess: isMember,
    project: isMember ? project : null,
    role,
  };
}

/**
 * Get all teams a user has access to via Clerk memberships.
 * Returns teams that the user is a member of in Clerk Organizations.
 */
export async function getUserTeams(
  db: typeof dbType,
  userId: string,
): Promise<Array<Team & { role: string }>> {
  const client = await clerkClient();

  try {
    // Get all organization memberships for the user
    const memberships = await client.users.getOrganizationMembershipList({
      userId,
    });

    if (!memberships.data || memberships.data.length === 0) {
      return [];
    }

    // Extract org IDs and create a map of orgId -> role
    const orgRoleMap = new Map<string, string>();
    for (const membership of memberships.data) {
      orgRoleMap.set(membership.organization.id, membership.role);
    }

    const orgIds = Array.from(orgRoleMap.keys());

    // Query local teams that match these Clerk org IDs
    const userTeams = await db.query.teams.findMany({
      where: (t, { inArray }) => inArray(t.clerkOrgId, orgIds),
    });

    // Add role to each team
    return userTeams.map((team) => ({
      ...team,
      role: orgRoleMap.get(team.clerkOrgId) ?? "org:member",
    }));
  } catch (error) {
    console.error("Failed to get user teams from Clerk:", error);
    return [];
  }
}
