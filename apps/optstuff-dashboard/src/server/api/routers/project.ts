import { eq, and, desc, inArray } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { projects, pinnedProjects, apiKeys } from "@/server/db/schema";
import { generateSlug, generateUniqueSlug } from "@/lib/slug";
import { generateApiKey } from "@/server/lib/api-key";
import {
  checkTeamAccess,
  checkTeamAccessBySlug,
  checkProjectAccess,
  getUserTeams,
} from "@/server/lib/team-access";

export const projectRouter = createTRPCRouter({
  /**
   * Create a new project under a team.
   * Automatically creates a default API key for the project.
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
      // Check team access via Clerk membership
      const { hasAccess } = await checkTeamAccess(
        ctx.db,
        input.teamId,
        ctx.userId,
      );

      if (!hasAccess) {
        throw new Error("Team not found or access denied");
      }

      const slug = generateSlug(input.name);
      const existingProject = await ctx.db.query.projects.findFirst({
        where: and(eq(projects.teamId, input.teamId), eq(projects.slug, slug)),
      });

      // Create the project
      const [newProject] = await ctx.db
        .insert(projects)
        .values({
          teamId: input.teamId,
          name: input.name,
          slug: existingProject ? generateUniqueSlug(input.name) : slug,
          description: input.description,
          apiKeyCount: 1, // Will have one default key
        })
        .returning();

      if (!newProject) {
        throw new Error("Failed to create project");
      }

      // Create default API key
      const { key, keyPrefix, keyHash } = generateApiKey();
      await ctx.db.insert(apiKeys).values({
        projectId: newProject.id,
        name: "Default",
        keyPrefix,
        keyHash,
        createdBy: ctx.userId,
      });

      return { ...newProject, defaultApiKey: key };
    }),

  /**
   * List all projects in a team.
   */
  list: protectedProcedure
    .input(z.object({ teamId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Check team access via Clerk membership
      const { hasAccess } = await checkTeamAccess(
        ctx.db,
        input.teamId,
        ctx.userId,
      );

      if (!hasAccess) return [];

      return ctx.db.query.projects.findMany({
        where: eq(projects.teamId, input.teamId),
        orderBy: [desc(projects.createdAt)],
      });
    }),

  /**
   * List all projects across all teams the user has access to.
   */
  listAll: protectedProcedure.query(async ({ ctx }) => {
    // Get all teams user has access to via Clerk
    const userTeams = await getUserTeams(ctx.db, ctx.userId);

    if (userTeams.length === 0) return [];

    const teamIds = userTeams.map((t) => t.id);
    const teamMap = new Map(userTeams.map((t) => [t.id, t]));

    // Get all projects for these teams
    const allProjects = await ctx.db.query.projects.findMany({
      where: inArray(projects.teamId, teamIds),
      orderBy: [desc(projects.createdAt)],
    });

    return allProjects.map((project) => {
      const team = teamMap.get(project.teamId)!;
      return {
        ...project,
        teamName: team.name,
        teamSlug: team.slug,
        isPersonalTeam: team.isPersonal,
      };
    });
  }),

  /**
   * Get a specific project by ID.
   */
  get: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { hasAccess, project } = await checkProjectAccess(
        ctx.db,
        input.projectId,
        ctx.userId,
      );

      if (!hasAccess) return null;
      return project;
    }),

  /**
   * Get a project by team slug and project slug.
   */
  getBySlug: protectedProcedure
    .input(z.object({ teamSlug: z.string(), projectSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check team access via Clerk membership
      const { hasAccess, team } = await checkTeamAccessBySlug(
        ctx.db,
        input.teamSlug,
        ctx.userId,
      );

      if (!hasAccess || !team) return null;

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
      const { hasAccess } = await checkProjectAccess(
        ctx.db,
        input.projectId,
        ctx.userId,
      );

      if (!hasAccess) {
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
      // Only admins can delete projects
      const { hasAccess } = await checkProjectAccess(
        ctx.db,
        input.projectId,
        ctx.userId,
        ["org:admin"],
      );

      if (!hasAccess) {
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
      const { hasAccess } = await checkProjectAccess(
        ctx.db,
        input.projectId,
        ctx.userId,
      );

      if (!hasAccess) {
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
   * Only returns projects the user has access to via Clerk membership.
   */
  listPinned: protectedProcedure.query(async ({ ctx }) => {
    // Get all teams user has access to
    const userTeams = await getUserTeams(ctx.db, ctx.userId);
    const teamIds = new Set(userTeams.map((t) => t.id));
    const teamMap = new Map(userTeams.map((t) => [t.id, t]));

    const pins = await ctx.db.query.pinnedProjects.findMany({
      where: eq(pinnedProjects.userId, ctx.userId),
      orderBy: [desc(pinnedProjects.pinnedAt)],
      with: { project: { with: { team: true } } },
    });

    // Filter to only projects in teams user has access to
    return pins
      .filter((pin) => teamIds.has(pin.project.teamId))
      .map((pin) => {
        const team = teamMap.get(pin.project.teamId)!;
        return {
          ...pin.project,
          teamName: team.name,
          teamSlug: team.slug,
          isPersonalTeam: team.isPersonal,
          pinnedAt: pin.pinnedAt,
        };
      });
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
