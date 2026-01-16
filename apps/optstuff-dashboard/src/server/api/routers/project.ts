import { eq, and, desc, inArray } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { projects, teams, pinnedProjects } from "@/server/db/schema";

/**
 * Generates a URL-friendly slug from a name.
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const projectRouter = createTRPCRouter({
  /**
   * Create a new project under a team.
   */
  create: protectedProcedure
    .input(
      z.object({
        teamId: z.string().uuid(),
        name: z.string().min(1).max(255),
        description: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, db } = ctx;

      // Verify user has access to the team
      const team = await db.query.teams.findFirst({
        where: and(eq(teams.id, input.teamId), eq(teams.ownerId, userId)),
      });

      if (!team) {
        throw new Error("Team not found or access denied");
      }

      const slug = generateSlug(input.name);

      // Check if slug already exists in this team
      const existingProject = await db.query.projects.findFirst({
        where: and(eq(projects.teamId, input.teamId), eq(projects.slug, slug)),
      });

      // If slug exists, append a timestamp
      const finalSlug = existingProject
        ? `${slug}-${Date.now().toString(36)}`
        : slug;

      const [newProject] = await db
        .insert(projects)
        .values({
          teamId: input.teamId,
          name: input.name,
          slug: finalSlug,
          description: input.description,
        })
        .returning();

      return newProject;
    }),

  /**
   * List all projects in a team.
   */
  list: protectedProcedure
    .input(z.object({ teamId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { userId, db } = ctx;

      // Verify user has access to the team
      const team = await db.query.teams.findFirst({
        where: and(eq(teams.id, input.teamId), eq(teams.ownerId, userId)),
      });

      if (!team) {
        return [];
      }

      const teamProjects = await db.query.projects.findMany({
        where: eq(projects.teamId, input.teamId),
        orderBy: [desc(projects.createdAt)],
      });

      return teamProjects;
    }),

  /**
   * List all projects the user has access to across all teams.
   */
  listAll: protectedProcedure.query(async ({ ctx }) => {
    const { userId, db } = ctx;

    // Get all teams the user owns
    const userTeams = await db.query.teams.findMany({
      where: eq(teams.ownerId, userId),
      with: {
        projects: true,
      },
    });

    // Flatten all projects with team info
    const allProjects = userTeams.flatMap((team) =>
      team.projects.map((project) => ({
        ...project,
        teamName: team.name,
        teamSlug: team.slug,
        isPersonalTeam: team.isPersonal,
      })),
    );

    // Sort by creation date, newest first
    return allProjects.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }),

  /**
   * Get a specific project by ID.
   */
  get: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { userId, db } = ctx;

      const project = await db.query.projects.findFirst({
        where: eq(projects.id, input.projectId),
        with: {
          team: true,
        },
      });

      if (!project) {
        return null;
      }

      // Verify user has access to the team
      if (project.team.ownerId !== userId) {
        return null;
      }

      return project;
    }),

  /**
   * Get a project by team slug and project slug.
   */
  getBySlug: protectedProcedure
    .input(
      z.object({
        teamSlug: z.string(),
        projectSlug: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { userId, db } = ctx;

      // First find the team
      const team = await db.query.teams.findFirst({
        where: and(eq(teams.slug, input.teamSlug), eq(teams.ownerId, userId)),
      });

      if (!team) {
        return null;
      }

      // Then find the project
      const project = await db.query.projects.findFirst({
        where: and(
          eq(projects.teamId, team.id),
          eq(projects.slug, input.projectSlug),
        ),
      });

      if (!project) {
        return null;
      }

      return {
        ...project,
        team,
      };
    }),

  /**
   * Update a project.
   */
  update: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, db } = ctx;

      // Get the project with team info
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, input.projectId),
        with: {
          team: true,
        },
      });

      if (!project || project.team.ownerId !== userId) {
        throw new Error("Project not found or access denied");
      }

      const updateData: { name?: string; description?: string } = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined)
        updateData.description = input.description;

      const [updatedProject] = await db
        .update(projects)
        .set(updateData)
        .where(eq(projects.id, input.projectId))
        .returning();

      return updatedProject;
    }),

  /**
   * Delete a project.
   */
  delete: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { userId, db } = ctx;

      // Get the project with team info
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, input.projectId),
        with: {
          team: true,
        },
      });

      if (!project || project.team.ownerId !== userId) {
        throw new Error("Project not found or access denied");
      }

      await db.delete(projects).where(eq(projects.id, input.projectId));

      return { success: true };
    }),

  /**
   * Pin a project for quick access.
   */
  pin: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { userId, db } = ctx;

      // Verify user has access to the project
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, input.projectId),
        with: {
          team: true,
        },
      });

      if (!project || project.team.ownerId !== userId) {
        throw new Error("Project not found or access denied");
      }

      // Check if already pinned
      const existingPin = await db.query.pinnedProjects.findFirst({
        where: and(
          eq(pinnedProjects.userId, userId),
          eq(pinnedProjects.projectId, input.projectId),
        ),
      });

      if (existingPin) {
        return { success: true, alreadyPinned: true };
      }

      // Create pin
      await db.insert(pinnedProjects).values({
        userId,
        projectId: input.projectId,
      });

      return { success: true, alreadyPinned: false };
    }),

  /**
   * Unpin a project.
   */
  unpin: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { userId, db } = ctx;

      await db
        .delete(pinnedProjects)
        .where(
          and(
            eq(pinnedProjects.userId, userId),
            eq(pinnedProjects.projectId, input.projectId),
          ),
        );

      return { success: true };
    }),

  /**
   * List all pinned projects for the current user.
   */
  listPinned: protectedProcedure.query(async ({ ctx }) => {
    const { userId, db } = ctx;

    // Get all pinned project IDs for this user
    const pins = await db.query.pinnedProjects.findMany({
      where: eq(pinnedProjects.userId, userId),
      orderBy: [desc(pinnedProjects.pinnedAt)],
      with: {
        project: {
          with: {
            team: true,
          },
        },
      },
    });

    // Filter out projects where user no longer has access and map to project format
    return pins
      .filter((pin) => pin.project.team.ownerId === userId)
      .map((pin) => ({
        ...pin.project,
        teamName: pin.project.team.name,
        teamSlug: pin.project.team.slug,
        isPersonalTeam: pin.project.team.isPersonal,
        pinnedAt: pin.pinnedAt,
      }));
  }),

  /**
   * Check if a project is pinned by the current user.
   */
  isPinned: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { userId, db } = ctx;

      const pin = await db.query.pinnedProjects.findFirst({
        where: and(
          eq(pinnedProjects.userId, userId),
          eq(pinnedProjects.projectId, input.projectId),
        ),
      });

      return { isPinned: !!pin };
    }),

  /**
   * Get pinned status for multiple projects at once.
   */
  getPinnedStatus: protectedProcedure
    .input(z.object({ projectIds: z.array(z.string().uuid()) }))
    .query(async ({ ctx, input }) => {
      const { userId, db } = ctx;

      if (input.projectIds.length === 0) {
        return {};
      }

      const pins = await db.query.pinnedProjects.findMany({
        where: and(
          eq(pinnedProjects.userId, userId),
          inArray(pinnedProjects.projectId, input.projectIds),
        ),
      });

      const pinnedSet = new Set(pins.map((p) => p.projectId));
      return Object.fromEntries(
        input.projectIds.map((id) => [id, pinnedSet.has(id)]),
      );
    }),
});
