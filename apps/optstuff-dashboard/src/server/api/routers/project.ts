import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { generateSlug, generateUniqueSlug } from "@/lib/slug";
import { verifyProjectAccess, verifyTeamAccess } from "@/server/api/lib/access";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { apiKeys, pinnedProjects, projects, teams } from "@/server/db/schema";
import { encryptApiKey, generateApiKey } from "@/server/lib/api-key";
import {
  invalidateProjectCache,
  markApiKeyCacheRevoked,
} from "@/server/lib/config-cache";
import {
  normalizeRefererDomainEntry,
  normalizeSourceDomainEntry,
  validateConfiguredSourceDomains,
} from "@/server/lib/validators";

const refererDomainEntrySchema = z
  .string()
  .trim()
  .transform((value, ctx) => {
    const result = normalizeRefererDomainEntry(value);
    if (!result.ok) {
      ctx.addIssue({ code: "custom", message: result.error });
      return z.NEVER;
    }
    return result.value;
  });

const allowedRefererDomainsSchema = z
  .array(refererDomainEntrySchema)
  .optional();

const sourceDomainEntrySchema = z
  .string()
  .trim()
  .transform((value, ctx) => {
    const result = normalizeSourceDomainEntry(value);
    if (!result.ok) {
      ctx.addIssue({ code: "custom", message: result.error });
      return z.NEVER;
    }
    return result.value;
  });

const allowedSourceDomainsSchema = z.array(sourceDomainEntrySchema).optional();

/**
 * Checks if an error is a Postgres unique-constraint violation for the given constraint name.
 * Postgres error code "23505" = unique_violation.
 */
function isUniqueConstraintError(
  error: unknown,
  constraintName: string,
): boolean {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { readonly code: string }).code === "23505"
  ) {
    if ("constraint_name" in error) {
      return (
        (error as { readonly constraint_name: string }).constraint_name ===
        constraintName
      );
    }
    return false;
  }
  return false;
}

async function assertSafeSourceDomains(
  allowedSourceDomains: readonly string[] | undefined,
) {
  if (!allowedSourceDomains || allowedSourceDomains.length === 0) return;

  const result = await validateConfiguredSourceDomains(allowedSourceDomains);
  if (!result.ok) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: result.error,
    });
  }
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
        allowedSourceDomains: allowedSourceDomainsSchema,
        allowedRefererDomains: allowedRefererDomainsSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyTeamAccess(ctx.db, input.teamId, ctx.userId);
      await assertSafeSourceDomains(input.allowedSourceDomains);

      const slug = generateSlug(input.name);

      // Determine initial slug: use unique slug for empty slugs (e.g. non-ASCII names)
      let finalSlug: string;
      if (!slug) {
        finalSlug = generateUniqueSlug(input.name);
      } else {
        const existingProject = await ctx.db.query.projects.findFirst({
          where: and(
            eq(projects.teamId, input.teamId),
            eq(projects.slug, slug),
          ),
        });
        finalSlug = existingProject ? generateUniqueSlug(input.name) : slug;
      }

      // Create default API key
      const { publicKey, secretKey } = generateApiKey();

      // Encrypt secret key before storing (public key is stored in plaintext)
      const encryptedSecretKey = encryptApiKey(secretKey);

      // Insert project and default key atomically, retrying once on slug collision.
      const createProjectWithDefaultKey = async (slugToUse: string) => {
        return ctx.db.transaction(async (tx) => {
          const [created] = await tx
            .insert(projects)
            .values({
              teamId: input.teamId,
              name: input.name,
              slug: slugToUse,
              description: input.description,
              allowedSourceDomains:
                input.allowedSourceDomains &&
                input.allowedSourceDomains.length > 0
                  ? input.allowedSourceDomains
                  : null,
              allowedRefererDomains:
                input.allowedRefererDomains &&
                input.allowedRefererDomains.length > 0
                  ? input.allowedRefererDomains
                  : null,
              apiKeyCount: 1,
            })
            .returning();

          if (!created) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to create project",
            });
          }

          await tx.insert(apiKeys).values({
            projectId: created.id,
            name: "Default",
            publicKey,
            secretKey: encryptedSecretKey,
            createdBy: ctx.userId,
          });

          return created;
        });
      };

      let newProject = await createProjectWithDefaultKey(finalSlug).catch(
        (error: unknown) => {
          if (isUniqueConstraintError(error, "project_team_slug_unique")) {
            return null;
          }
          throw error;
        },
      );

      // Retry once with a freshly generated unique slug
      if (!newProject) {
        finalSlug = generateUniqueSlug(input.name);
        newProject = await createProjectWithDefaultKey(finalSlug);
      }

      if (!newProject) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create project",
        });
      }

      return {
        ...newProject,
        defaultApiKey: publicKey,
        defaultSecretKey: secretKey,
      };
    }),

  /**
   * List all projects in a team.
   */
  list: protectedProcedure
    .input(z.object({ teamId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await verifyTeamAccess(ctx.db, input.teamId, ctx.userId);

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
      return verifyProjectAccess(ctx.db, input.projectId, ctx.userId);
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
      if (team?.ownerId !== ctx.userId) {
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
      await verifyProjectAccess(ctx.db, input.projectId, ctx.userId);

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
   * Update project domain security settings (source domains + referer domains).
   */
  updateSettings: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        allowedSourceDomains: z.array(sourceDomainEntrySchema),
        allowedRefererDomains: z.array(refererDomainEntrySchema),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyProjectAccess(ctx.db, input.projectId, ctx.userId);
      await assertSafeSourceDomains(input.allowedSourceDomains);

      const allowedSourceDomains = input.allowedSourceDomains.length
        ? input.allowedSourceDomains
        : null;
      const allowedRefererDomains = input.allowedRefererDomains.length
        ? input.allowedRefererDomains
        : null;

      const [updatedProject] = await ctx.db
        .update(projects)
        .set({
          allowedSourceDomains,
          allowedRefererDomains,
        })
        .where(eq(projects.id, input.projectId))
        .returning();

      // Invalidate cache so IPX service picks up new settings
      if (updatedProject) {
        await invalidateProjectCache(updatedProject.slug, updatedProject.id);
      }

      return updatedProject;
    }),

  /**
   * Get project domain security settings (source domains + referer domains).
   */
  getSettings: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const project = await verifyProjectAccess(
        ctx.db,
        input.projectId,
        ctx.userId,
      );

      return {
        allowedSourceDomains: project.allowedSourceDomains ?? [],
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

      // Collect public keys before cascade-deleting them with the project
      const projectApiKeys = await ctx.db.query.apiKeys.findMany({
        where: eq(apiKeys.projectId, input.projectId),
        columns: { publicKey: true },
      });

      await ctx.db.delete(projects).where(eq(projects.id, input.projectId));

      // Invalidate Redis caches for the project and all its API keys
      await Promise.all([
        invalidateProjectCache(project.slug, project.id),
        ...projectApiKeys.map((key) => markApiKeyCacheRevoked(key.publicKey)),
      ]);

      return { success: true };
    }),

  /**
   * Pin a project.
   */
  pin: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await verifyProjectAccess(ctx.db, input.projectId, ctx.userId);

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
