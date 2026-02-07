import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { generateSlug, generateUniqueSlug } from "@/lib/slug";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import type { db as dbType } from "@/server/db";
import { apiKeys, pinnedProjects, projects, teams } from "@/server/db/schema";
import { encryptApiKey, generateApiKey } from "@/server/lib/api-key";
import { invalidateProjectCache } from "@/server/lib/config-cache";

/**
 * Helper to verify user owns the team.
 * Returns the team if access is granted, null otherwise.
 */
async function verifyTeamAccess(
  db: typeof dbType,
  teamId: string,
  userId: string,
) {
  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
  });

  if (!team || team.ownerId !== userId) {
    return null;
  }

  return team;
}

/**
 * Helper to verify user owns the project's team.
 * Returns the project with team if access is granted, null otherwise.
 */
async function verifyProjectAccess(
  db: typeof dbType,
  projectId: string,
  userId: string,
) {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: { team: true },
  });

  if (!project || project.team.ownerId !== userId) {
    return null;
  }

  return project;
}

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
      // Verify user owns this team
      const team = await verifyTeamAccess(ctx.db, input.teamId, ctx.userId);

      if (!team) {
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
      const { key, keyPrefix, secretKey } = generateApiKey();

      // Encrypt keys before storing
      const encryptedKeyFull = encryptApiKey(key);
      const encryptedSecretKey = encryptApiKey(secretKey);

      await ctx.db.insert(apiKeys).values({
        projectId: newProject.id,
        name: "Default",
        keyPrefix,
        keyFull: encryptedKeyFull,
        secretKey: encryptedSecretKey,
        createdBy: ctx.userId,
      });

      return { ...newProject, defaultApiKey: key, defaultSecretKey: secretKey };
    }),

  /**
   * List all projects in a team.
   */
  list: protectedProcedure
    .input(z.object({ teamId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify user owns this team
      const team = await verifyTeamAccess(ctx.db, input.teamId, ctx.userId);

      if (!team) {
        return [];
      }

      return ctx.db.query.projects.findMany({
        where: eq(projects.teamId, input.teamId),
        orderBy: [desc(projects.createdAt)],
      });
    }),

  /**
   * List all projects across all teams the user owns.
   */
  listAll: protectedProcedure.query(async ({ ctx }) => {
    // Get all teams the user owns
    const userTeams = await ctx.db.query.teams.findMany({
      where: eq(teams.ownerId, ctx.userId),
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
   */
  get: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const project = await verifyProjectAccess(
        ctx.db,
        input.projectId,
        ctx.userId,
      );

      if (!project) {
        return null;
      }

      return project;
    }),

  /**
   * Get a project by team slug and project slug.
   */
  getBySlug: protectedProcedure
    .input(z.object({ teamSlug: z.string(), projectSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      const team = await ctx.db.query.teams.findFirst({
        where: eq(teams.slug, input.teamSlug),
      });

      // Verify user owns this team
      if (!team || team.ownerId !== ctx.userId) {
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
      const project = await verifyProjectAccess(
        ctx.db,
        input.projectId,
        ctx.userId,
      );

      if (!project) {
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
   * Update project authorization settings (referer domain whitelist).
   * Note: Source domain restrictions are now configured per API key.
   */
  updateSettings: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        allowedRefererDomains: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const project = await verifyProjectAccess(
        ctx.db,
        input.projectId,
        ctx.userId,
      );

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found or access denied",
        });
      }

      const updateData: {
        allowedRefererDomains?: string[];
      } = {};

      if (input.allowedRefererDomains !== undefined) {
        updateData.allowedRefererDomains = input.allowedRefererDomains
          .map((d) => d.trim().toLowerCase())
          .filter((d) => d.length > 0);
      }

      if (Object.keys(updateData).length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No settings to update",
        });
      }

      const [updatedProject] = await ctx.db
        .update(projects)
        .set(updateData)
        .where(eq(projects.id, input.projectId))
        .returning();

      // Invalidate cache so IPX service picks up new settings
      if (updatedProject) {
        await invalidateProjectCache(updatedProject.slug);
      }

      return updatedProject;
    }),

  /**
   * Get project settings (referer domain whitelist).
   * Note: Source domain restrictions are now configured per API key.
   */
  getSettings: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const project = await verifyProjectAccess(
        ctx.db,
        input.projectId,
        ctx.userId,
      );

      if (!project) {
        return null;
      }

      return {
        allowedRefererDomains: project.allowedRefererDomains ?? [],
      };
    }),

  /**
   * Delete a project.
   * Only the team owner can delete.
   */
  delete: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const project = await verifyProjectAccess(
        ctx.db,
        input.projectId,
        ctx.userId,
      );

      if (!project) {
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
   */
  pin: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const project = await verifyProjectAccess(
        ctx.db,
        input.projectId,
        ctx.userId,
      );

      if (!project) {
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
   */
  listPinned: protectedProcedure.query(async ({ ctx }) => {
    // Get all teams the user owns
    const userTeams = await ctx.db.query.teams.findMany({
      where: eq(teams.ownerId, ctx.userId),
    });

    const teamMap = new Map(userTeams.map((t) => [t.id, t]));

    const pins = await ctx.db.query.pinnedProjects.findMany({
      where: eq(pinnedProjects.userId, ctx.userId),
      orderBy: [desc(pinnedProjects.pinnedAt)],
      with: { project: { with: { team: true } } },
    });

    // Filter to only projects in teams user owns
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
