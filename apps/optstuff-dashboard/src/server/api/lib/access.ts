import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

import type { db as dbType } from "@/server/db";
import { projects, teams } from "@/server/db/schema";

/**
 * Verify user owns the team. Throws if the team doesn't exist or the user
 * is not the owner, so callers always receive a valid team.
 */
export async function verifyTeamAccess(
  db: typeof dbType,
  teamId: string,
  userId: string,
) {
  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
  });

  if (!team) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" });
  }

  if (team.ownerId !== userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
  }

  return team;
}

/**
 * Verify user owns the project's team. Throws if the project doesn't exist
 * or the user is not the team owner, so callers always receive a valid project.
 */
export async function verifyProjectAccess(
  db: typeof dbType,
  projectId: string,
  userId: string,
) {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: { team: true },
  });

  if (!project) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
  }

  if (project.team.ownerId !== userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
  }

  return project;
}
