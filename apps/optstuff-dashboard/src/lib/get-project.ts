import "server-only";

import { db } from "@/server/db";
import { projects } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { cache } from "react";

import { getVerifiedTeam } from "./get-team";

/**
 * Verify the current user owns the project identified by team + project slugs.
 * Returns both the team and project. Calls `notFound()` if the project doesn't exist.
 */
export const getVerifiedProject = cache(
  async (teamSlug: string, projectSlug: string) => {
    const team = await getVerifiedTeam(teamSlug);

    const project = await db.query.projects.findFirst({
      where: and(eq(projects.teamId, team.id), eq(projects.slug, projectSlug)),
    });

    if (!project) {
      notFound();
    }

    return { team, project };
  },
);
