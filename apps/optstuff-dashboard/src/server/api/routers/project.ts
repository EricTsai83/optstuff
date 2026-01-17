import { eq, and, desc, inArray } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { projects, teams, pinnedProjects } from "@/server/db/schema";
import { generateSlug, generateUniqueSlug } from "@/lib/slug";

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
      const team = await ctx.db.query.teams.findFirst({
        where: and(eq(teams.id, input.teamId), eq(teams.ownerId, ctx.userId)),
      });

      if (!team) throw new Error("Team not found or access denied");

      const slug = generateSlug(input.name);
      const existingProject = await ctx.db.query.projects.findFirst({
        where: and(eq(projects.teamId, input.teamId), eq(projects.slug, slug)),
      });

      const [newProject] = await ctx.db
        .insert(projects)
        .values({
          teamId: input.teamId,
          name: input.name,
          slug: existingProject ? generateUniqueSlug(input.name) : slug,
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
      const team = await ctx.db.query.teams.findFirst({
        where: and(eq(teams.id, input.teamId), eq(teams.ownerId, ctx.userId)),
      });

      if (!team) return [];

      return ctx.db.query.projects.findMany({
        where: eq(projects.teamId, input.teamId),
        orderBy: [desc(projects.createdAt)],
      });
    }),

  /**
   * List all projects across all teams.
   */
  listAll: protectedProcedure.query(async ({ ctx }) => {
    const userTeams = await ctx.db.query.teams.findMany({
      where: eq(teams.ownerId, ctx.userId),
      with: { projects: true },
    });

    return userTeams
      .flatMap((team) =>
        team.projects.map((project) => ({
          ...project,
          teamName: team.name,
          teamSlug: team.slug,
          isPersonalTeam: team.isPersonal,
        })),
      )
      .sort(
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
      const project = await ctx.db.query.projects.findFirst({
        where: eq(projects.id, input.projectId),
        with: { team: true },
      });

      if (!project || project.team.ownerId !== ctx.userId) return null;
      return project;
    }),

  /**
   * Get a project by team slug and project slug.
   */
  getBySlug: protectedProcedure
    .input(z.object({ teamSlug: z.string(), projectSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      const team = await ctx.db.query.teams.findFirst({
        where: and(
          eq(teams.slug, input.teamSlug),
          eq(teams.ownerId, ctx.userId),
        ),
      });

      if (!team) return null;

      const project = await ctx.db.query.projects.findFirst({
        where: and(
          eq(projects.teamId, team.id),
          eq(projects.slug, input.projectSlug),
        ),
      });

      return project ? { ...project, team } : null;
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
      const project = await ctx.db.query.projects.findFirst({
        where: eq(projects.id, input.projectId),
        with: { team: true },
      });

      if (!project || project.team.ownerId !== ctx.userId) {
        throw new Error("Project not found or access denied");
      }

      const updateData: { name?: string; description?: string } = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined)
        updateData.description = input.description;

      if (Object.keys(updateData).length === 0) {
        throw new Error("No fields to update");
      }

      const [updatedProject] = await ctx.db
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
      const project = await ctx.db.query.projects.findFirst({
        where: eq(projects.id, input.projectId),
        with: { team: true },
      });

      if (!project || project.team.ownerId !== ctx.userId) {
        throw new Error("Project not found or access denied");
      }

      await ctx.db.delete(projects).where(eq(projects.id, input.projectId));
      return { success: true };
    }),

  /**
   * Pin a project.
   */
  pin: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.query.projects.findFirst({
        where: eq(projects.id, input.projectId),
        with: { team: true },
      });

      if (!project || project.team.ownerId !== ctx.userId) {
        throw new Error("Project not found or access denied");
      }

      const existingPin = await ctx.db.query.pinnedProjects.findFirst({
        where: and(
          eq(pinnedProjects.userId, ctx.userId),
          eq(pinnedProjects.projectId, input.projectId),
        ),
      });

      if (existingPin) return { success: true, alreadyPinned: true };

      await ctx.db
        .insert(pinnedProjects)
        .values({ userId: ctx.userId, projectId: input.projectId });

      return { success: true, alreadyPinned: false };
    }),

  /**
   * Unpin a project.
   */
  unpin: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(pinnedProjects)
        .where(
          and(
            eq(pinnedProjects.userId, ctx.userId),
            eq(pinnedProjects.projectId, input.projectId),
          ),
        );

      return { success: true };
    }),

  /**
   * List all pinned projects.
   */
  listPinned: protectedProcedure.query(async ({ ctx }) => {
    const pins = await ctx.db.query.pinnedProjects.findMany({
      where: eq(pinnedProjects.userId, ctx.userId),
      orderBy: [desc(pinnedProjects.pinnedAt)],
      with: { project: { with: { team: true } } },
    });

    return pins
      .filter((pin) => pin.project.team.ownerId === ctx.userId)
      .map((pin) => ({
        ...pin.project,
        teamName: pin.project.team.name,
        teamSlug: pin.project.team.slug,
        isPersonalTeam: pin.project.team.isPersonal,
        pinnedAt: pin.pinnedAt,
      }));
  }),

  /**
   * Check if a project is pinned.
   */
  isPinned: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const pin = await ctx.db.query.pinnedProjects.findFirst({
        where: and(
          eq(pinnedProjects.userId, ctx.userId),
          eq(pinnedProjects.projectId, input.projectId),
        ),
      });

      return { isPinned: !!pin };
    }),

  /**
   * Get pinned status for multiple projects.
   */
  getPinnedStatus: protectedProcedure
    .input(z.object({ projectIds: z.array(z.string().uuid()) }))
    .query(async ({ ctx, input }) => {
      if (!input.projectIds.length) return {};

      const pins = await ctx.db.query.pinnedProjects.findMany({
        where: and(
          eq(pinnedProjects.userId, ctx.userId),
          inArray(pinnedProjects.projectId, input.projectIds),
        ),
      });

      const pinnedSet = new Set(pins.map((p) => p.projectId));
      return Object.fromEntries(
        input.projectIds.map((id) => [id, pinnedSet.has(id)]),
      );
    }),
});
