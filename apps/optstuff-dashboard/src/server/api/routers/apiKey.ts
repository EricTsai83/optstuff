import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { RATE_LIMITS } from "@/lib/constants";
import { verifyProjectAccess } from "@/server/api/lib/access";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import type { db as dbType } from "@/server/db";
import { apiKeys, projects } from "@/server/db/schema";
import { encryptApiKey, generateApiKey } from "@/server/lib/api-key";
import { invalidateApiKeyCache } from "@/server/lib/config-cache";

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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyProjectAccess(ctx.db, input.projectId, ctx.userId);

      const { publicKey, secretKey } = generateApiKey();

      // Encrypt secret key before storing (public key is stored in plaintext)
      const encryptedSecretKey = encryptApiKey(secretKey);

      const [newApiKey] = await ctx.db
        .insert(apiKeys)
        .values({
          projectId: input.projectId,
          name: input.name,
          publicKey,
          secretKey: encryptedSecretKey,
          createdBy: ctx.userId,
          expiresAt: input.expiresAt,
          rateLimitPerMinute: RATE_LIMITS.perMinute,
          rateLimitPerDay: RATE_LIMITS.perDay,
        })
        .returning();

      // Update project's API key count
      await updateProjectApiKeyCount(ctx.db, input.projectId);

      // Return with plaintext secret key (only shown once!)
      return { ...newApiKey, secretKey };
    }),

  /**
   * List all active API keys for a project.
   */
  list: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await verifyProjectAccess(ctx.db, input.projectId, ctx.userId);

      const keys = await ctx.db.query.apiKeys.findMany({
        where: and(
          eq(apiKeys.projectId, input.projectId),
          isNull(apiKeys.revokedAt),
        ),
        orderBy: [desc(apiKeys.createdAt)],
      });

      // Public key is already plaintext; strip encrypted secretKey from response.
      return keys.map(({ secretKey: _secretKey, ...safeKey }) => safeKey);
    }),

  /**
   * List all API keys for a project, including revoked ones.
   */
  listAll: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await verifyProjectAccess(ctx.db, input.projectId, ctx.userId);

      const keys = await ctx.db.query.apiKeys.findMany({
        where: eq(apiKeys.projectId, input.projectId),
        orderBy: [desc(apiKeys.createdAt)],
      });

      // Public key is already plaintext; strip encrypted secretKey from response.
      return keys.map(({ secretKey: _secretKey, ...safeKey }) => safeKey);
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

      await verifyProjectAccess(ctx.db, apiKey.projectId, ctx.userId);

      // Public key is already plaintext; strip encrypted secretKey from response.
      const { secretKey: _secretKey, ...safeKey } = apiKey;
      return safeKey;
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

      await verifyProjectAccess(ctx.db, apiKey.projectId, ctx.userId);

      const [revokedKey] = await ctx.db
        .update(apiKeys)
        .set({ revokedAt: new Date() })
        .where(eq(apiKeys.id, input.apiKeyId))
        .returning();

      // Update project's API key count
      await updateProjectApiKeyCount(ctx.db, apiKey.projectId);

      // Invalidate cache — best-effort so revoke still succeeds if Redis is down.
      // The 60s TTL provides a self-healing fallback.
      try {
        await invalidateApiKeyCache(apiKey.publicKey);
      } catch (error) {
        console.error(
          `Failed to invalidate cache for revoked API key ${apiKey.publicKey}:`,
          error,
        );
      }

      // Strip encrypted secretKey from response (consistent with list/get).
      const { secretKey: _secretKey, ...safeKey } = revokedKey!;
      return safeKey;
    }),

  /**
   * Rotate an API key - revoke the old one and create a new one.
   * Preserves the allowed source domains from the old key.
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

      await verifyProjectAccess(ctx.db, oldApiKey.projectId, ctx.userId);

      const { publicKey, secretKey } = generateApiKey();

      // Encrypt secret key before storing (public key is stored in plaintext)
      const encryptedSecretKey = encryptApiKey(secretKey);

      // Wrap revoke + insert in a transaction so the user never loses
      // their API key if the insert fails after the old key is revoked.
      const [newApiKey] = await ctx.db.transaction(async (tx) => {
        // Revoke the old key
        await tx
          .update(apiKeys)
          .set({ revokedAt: new Date() })
          .where(eq(apiKeys.id, input.apiKeyId));

        // Insert the new key
        return tx
          .insert(apiKeys)
          .values({
            projectId: oldApiKey.projectId,
            name: oldApiKey.name,
            publicKey,
            secretKey: encryptedSecretKey,
            createdBy: ctx.userId,
            expiresAt: oldApiKey.expiresAt,
            rateLimitPerMinute: oldApiKey.rateLimitPerMinute,
            rateLimitPerDay: oldApiKey.rateLimitPerDay,
          })
          .returning();
      });

      // Invalidate cache — best-effort, outside the transaction.
      // The 60s TTL provides a self-healing fallback.
      try {
        await invalidateApiKeyCache(oldApiKey.publicKey);
      } catch (error) {
        console.error(
          `Failed to invalidate cache for rotated API key ${oldApiKey.publicKey}:`,
          error,
        );
      }

      // Count doesn't change on rotation (one revoked, one created)

      // Return with plaintext secret key (only shown once!)
      return { ...newApiKey, secretKey };
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

      await verifyProjectAccess(ctx.db, apiKey.projectId, ctx.userId);

      const updateData: {
        name?: string;
        expiresAt?: Date | null;
      } = {};

      if (input.name !== undefined) updateData.name = input.name;
      if (input.expiresAt !== undefined) updateData.expiresAt = input.expiresAt;

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

      // Invalidate cache — best-effort so update still succeeds if Redis is down.
      try {
        await invalidateApiKeyCache(apiKey.publicKey);
      } catch (error) {
        console.error(
          `Failed to invalidate cache for updated API key ${apiKey.publicKey}:`,
          error,
        );
      }

      // Strip encrypted secretKey from response (consistent with list/get).
      const { secretKey: _secretKey, ...safeKey } = updatedKey!;
      return safeKey;
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

      await verifyProjectAccess(ctx.db, apiKey.projectId, ctx.userId);

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
