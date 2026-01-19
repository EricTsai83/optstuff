import { eq, and, desc, inArray } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { clerkClient, auth } from "@workspace/auth/server";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { projects, pinnedProjects, apiKeys, teams } from "@/server/db/schema";
import { generateSlug, generateUniqueSlug } from "@/lib/slug";
import { generateApiKey } from "@/server/lib/api-key";

export const projectRouter = createTRPCRouter({
  /**
   * Create a new project under a team.
   * Automatically creates a default API key for the project.
   * Uses session's orgId to verify access.
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
      const { orgId } = await auth();

      // Verify team belongs to user's active organization
      const team = await ctx.db.query.teams.findFirst({
        where: eq(teams.id, input.teamId),
      });

      if (!team || team.clerkOrgId !== orgId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found or access denied",
        });
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
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create project",
        });
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
   * Uses session's orgId to verify access.
   */
  list: protectedProcedure
    .input(z.object({ teamId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { orgId } = await auth();

      // Verify team belongs to user's active organization
      const team = await ctx.db.query.teams.findFirst({
        where: eq(teams.id, input.teamId),
      });

      if (!team || team.clerkOrgId !== orgId) {
        return [];
      }

      return ctx.db.query.projects.findMany({
        where: eq(projects.teamId, input.teamId),
        orderBy: [desc(projects.createdAt)],
      });
    }),

  /**
   * List all projects across all teams the user has access to.
   * Note: This requires Clerk API call as we need ALL teams, not just active one.
   */
  listAll: protectedProcedure.query(async ({ ctx }) => {
    const client = await clerkClient();

    // Get all organization memberships for the user from Clerk
    const memberships = await client.users.getOrganizationMembershipList({
      userId: ctx.userId,
    });

    if (!memberships.data || memberships.data.length === 0) {
      return [];
    }

    const orgIds = memberships.data.map((m) => m.organization.id);

    // Query local teams that match these Clerk org IDs
    const userTeams = await ctx.db.query.teams.findMany({
      where: inArray(teams.clerkOrgId, orgIds),
    });

    if (userTeams.length === 0) return [];

    const teamIds = userTeams.map((t) => t.id);
    const teamMap = new Map(userTeams.map((t) => [t.id, t]));

    // Get all projects for these teams
    const allProjects = await ctx.db.query.projects.findMany({
      where: inArray(projects.teamId, teamIds),
      orderBy: [desc(projects.createdAt)],
    });

    return allProjects.flatMap((project) => {
      const team = teamMap.get(project.teamId);
      if (!team) {
        // This shouldn't happen given our query filters by teamIds
        console.warn(
          `Project ${project.id} references unknown team ${project.teamId}`,
        );
        return [];
      }
      return [
        {
          ...project,
          teamName: team.name,
          teamSlug: team.slug,
          isPersonalTeam: team.isPersonal,
        },
      ];
    });
  }),

  /**
   * Get a specific project by ID.
   * Uses session's orgId to verify access.
   */
  get: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { orgId } = await auth();

      const project = await ctx.db.query.projects.findFirst({
        where: eq(projects.id, input.projectId),
        with: { team: true },
      });

      // Verify the project's team belongs to user's active organization
      if (!project || project.team.clerkOrgId !== orgId) {
        return null;
      }

      return project;
    }),

  /**
   * Get a project by team slug and project slug.
   * Uses session's orgSlug to verify access.
   */
  getBySlug: protectedProcedure
    .input(z.object({ teamSlug: z.string(), projectSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      const { orgSlug, orgId } = await auth();

      // Quick check: if slug doesn't match active org, deny access
      if (orgSlug !== input.teamSlug) {
        return null;
      }

      const team = await ctx.db.query.teams.findFirst({
        where: eq(teams.slug, input.teamSlug),
      });

      // Double-check orgId matches for security
      if (!team || team.clerkOrgId !== orgId) {
        return null;
      }

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
   * Uses session's orgId to verify access.
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
      const { orgId } = await auth();

      const project = await ctx.db.query.projects.findFirst({
        where: eq(projects.id, input.projectId),
        with: { team: true },
      });

      if (!project || project.team.clerkOrgId !== orgId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found or access denied",
        });
      }

      const updateData: { name?: string; description?: string } = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined)
        updateData.description = input.description;

      if (Object.keys(updateData).length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No fields to update",
        });
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
   * Only org:admin can delete. Uses has() to check role.
   */
  delete: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { has, orgId } = await auth();

      // Use has() to check admin role (reads from session token, no API call)
      if (!has({ role: "org:admin" })) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin role required",
        });
      }

      const project = await ctx.db.query.projects.findFirst({
        where: eq(projects.id, input.projectId),
        with: { team: true },
      });

      if (!project || project.team.clerkOrgId !== orgId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found or access denied",
        });
      }

      await ctx.db.delete(projects).where(eq(projects.id, input.projectId));
      return { success: true };
    }),

  /**
   * Pin a project.
   * Uses session's orgId to verify access.
   */
  pin: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { orgId } = await auth();

      const project = await ctx.db.query.projects.findFirst({
        where: eq(projects.id, input.projectId),
        with: { team: true },
      });

      if (!project || project.team.clerkOrgId !== orgId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found or access denied",
        });
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
   * Note: This requires Clerk API call as we need ALL teams, not just active one.
   */
  listPinned: protectedProcedure.query(async ({ ctx }) => {
    const client = await clerkClient();

    // Get all organization memberships for the user from Clerk
    const memberships = await client.users.getOrganizationMembershipList({
      userId: ctx.userId,
    });

    if (!memberships.data || memberships.data.length === 0) {
      return [];
    }

    const orgIds = memberships.data.map((m) => m.organization.id);

    // Query local teams that match these Clerk org IDs
    const userTeams = await ctx.db.query.teams.findMany({
      where: inArray(teams.clerkOrgId, orgIds),
    });

    const teamMap = new Map(userTeams.map((t) => [t.id, t]));

    const pins = await ctx.db.query.pinnedProjects.findMany({
      where: eq(pinnedProjects.userId, ctx.userId),
      orderBy: [desc(pinnedProjects.pinnedAt)],
      with: { project: { with: { team: true } } },
    });

    // Filter to only projects in teams user has access to
    return pins.flatMap((pin) => {
      const team = teamMap.get(pin.project.teamId);
      if (!team) return [];
      return [
        {
          ...pin.project,
          teamName: team.name,
          teamSlug: team.slug,
          isPersonalTeam: team.isPersonal,
          pinnedAt: pin.pinnedAt,
        },
      ];
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
