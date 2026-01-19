import { eq, and, isNull, desc, count } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { auth } from "@workspace/auth/server";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { apiKeys, projects } from "@/server/db/schema";
import { generateApiKey } from "@/server/lib/api-key";
import type { db as dbType } from "@/server/db";

/** Helper to update project's API key count using SQL count() */
async function updateProjectApiKeyCount(db: typeof dbType, projectId: string) {
  const [result] = await db
    .select({ count: count() })
    .from(apiKeys)
    .where(and(eq(apiKeys.projectId, projectId), isNull(apiKeys.revokedAt)));

  await db
    .update(projects)
    .set({ apiKeyCount: result?.count ?? 0 })
    .where(eq(projects.id, projectId));
}

/**
 * Helper to check project access using session's orgId.
 * Returns the project with team if access is granted, null otherwise.
 */
async function verifyProjectAccess(db: typeof dbType, projectId: string) {
  const { orgId } = await auth();

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: { team: true },
  });

  if (!project || project.team.clerkOrgId !== orgId) {
    return null;
  }

  return project;
}

export const apiKeyRouter = createTRPCRouter({
  /**
   * Create a new API key for a project.
   */
  create: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        name: z.string().min(1).max(255),
        expiresAt: z.date().optional(),
        rateLimitPerMinute: z.number().int().min(1).max(10000).optional(),
        rateLimitPerDay: z.number().int().min(1).max(1000000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const project = await verifyProjectAccess(ctx.db, input.projectId);

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found or access denied",
        });
      }

      const { key, keyPrefix, keyHash } = generateApiKey();

      const [newApiKey] = await ctx.db
        .insert(apiKeys)
        .values({
          projectId: input.projectId,
          name: input.name,
          keyPrefix,
          keyHash,
          createdBy: ctx.userId,
          expiresAt: input.expiresAt,
          rateLimitPerMinute: input.rateLimitPerMinute ?? 60,
          rateLimitPerDay: input.rateLimitPerDay ?? 10000,
        })
        .returning();

      // Update project's API key count
      await updateProjectApiKeyCount(ctx.db, input.projectId);

      return { ...newApiKey, key };
    }),

  /**
   * List all active API keys for a project.
   */
  list: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const project = await verifyProjectAccess(ctx.db, input.projectId);

      if (!project) return [];

      return ctx.db.query.apiKeys.findMany({
        where: and(
          eq(apiKeys.projectId, input.projectId),
          isNull(apiKeys.revokedAt),
        ),
        orderBy: [desc(apiKeys.createdAt)],
      });
    }),

  /**
   * List all API keys for a project, including revoked ones.
   */
  listAll: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const project = await verifyProjectAccess(ctx.db, input.projectId);

      if (!project) return [];

      return ctx.db.query.apiKeys.findMany({
        where: eq(apiKeys.projectId, input.projectId),
        orderBy: [desc(apiKeys.createdAt)],
      });
    }),

  /**
   * Get a specific API key by ID.
   */
  get: protectedProcedure
    .input(z.object({ apiKeyId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const apiKey = await ctx.db.query.apiKeys.findFirst({
        where: eq(apiKeys.id, input.apiKeyId),
        with: { project: true },
      });

      if (!apiKey) return null;

      // Check access to the project
      const project = await verifyProjectAccess(ctx.db, apiKey.projectId);

      if (!project) return null;

      return apiKey;
    }),

  /**
   * Revoke an API key.
   */
  revoke: protectedProcedure
    .input(z.object({ apiKeyId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const apiKey = await ctx.db.query.apiKeys.findFirst({
        where: eq(apiKeys.id, input.apiKeyId),
      });

      if (!apiKey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API key not found",
        });
      }

      const project = await verifyProjectAccess(ctx.db, apiKey.projectId);

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API key not found or access denied",
        });
      }

      const [revokedKey] = await ctx.db
        .update(apiKeys)
        .set({ revokedAt: new Date() })
        .where(eq(apiKeys.id, input.apiKeyId))
        .returning();

      // Update project's API key count
      await updateProjectApiKeyCount(ctx.db, apiKey.projectId);

      return revokedKey;
    }),

  /**
   * Rotate an API key - revoke the old one and create a new one.
   */
  rotate: protectedProcedure
    .input(z.object({ apiKeyId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const oldApiKey = await ctx.db.query.apiKeys.findFirst({
        where: eq(apiKeys.id, input.apiKeyId),
      });

      if (!oldApiKey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API key not found",
        });
      }

      const project = await verifyProjectAccess(ctx.db, oldApiKey.projectId);

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API key not found or access denied",
        });
      }

      // Revoke the old key
      await ctx.db
        .update(apiKeys)
        .set({ revokedAt: new Date() })
        .where(eq(apiKeys.id, input.apiKeyId));

      const { key, keyPrefix, keyHash } = generateApiKey();

      const [newApiKey] = await ctx.db
        .insert(apiKeys)
        .values({
          projectId: oldApiKey.projectId,
          name: oldApiKey.name,
          keyPrefix,
          keyHash,
          createdBy: ctx.userId,
          expiresAt: oldApiKey.expiresAt,
          rateLimitPerMinute: oldApiKey.rateLimitPerMinute,
          rateLimitPerDay: oldApiKey.rateLimitPerDay,
        })
        .returning();

      // Count doesn't change on rotation (one revoked, one created)

      return { ...newApiKey, key };
    }),

  /**
   * Update API key settings.
   */
  update: protectedProcedure
    .input(
      z.object({
        apiKeyId: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        expiresAt: z.date().nullable().optional(),
        rateLimitPerMinute: z.number().int().min(1).max(10000).optional(),
        rateLimitPerDay: z.number().int().min(1).max(1000000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const apiKey = await ctx.db.query.apiKeys.findFirst({
        where: eq(apiKeys.id, input.apiKeyId),
      });

      if (!apiKey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API key not found",
        });
      }

      const project = await verifyProjectAccess(ctx.db, apiKey.projectId);

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API key not found or access denied",
        });
      }

      const updateData: {
        name?: string;
        expiresAt?: Date | null;
        rateLimitPerMinute?: number;
        rateLimitPerDay?: number;
      } = {};

      if (input.name !== undefined) updateData.name = input.name;
      if (input.expiresAt !== undefined) updateData.expiresAt = input.expiresAt;
      if (input.rateLimitPerMinute !== undefined)
        updateData.rateLimitPerMinute = input.rateLimitPerMinute;
      if (input.rateLimitPerDay !== undefined)
        updateData.rateLimitPerDay = input.rateLimitPerDay;

      if (Object.keys(updateData).length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No fields to update",
        });
      }

      const [updatedKey] = await ctx.db
        .update(apiKeys)
        .set(updateData)
        .where(eq(apiKeys.id, input.apiKeyId))
        .returning();

      return updatedKey;
    }),

  /**
   * Update the last used timestamp for an API key.
   */
  updateLastUsed: protectedProcedure
    .input(z.object({ apiKeyId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const apiKey = await ctx.db.query.apiKeys.findFirst({
        where: eq(apiKeys.id, input.apiKeyId),
      });

      if (!apiKey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API key not found",
        });
      }

      const project = await verifyProjectAccess(ctx.db, apiKey.projectId);

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API key not found or access denied",
        });
      }

      await ctx.db
        .update(apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeys.id, input.apiKeyId));

      // Update project's last activity
      await ctx.db
        .update(projects)
        .set({ lastActivityAt: new Date() })
        .where(eq(projects.id, apiKey.projectId));

      return { success: true };
    }),
});
