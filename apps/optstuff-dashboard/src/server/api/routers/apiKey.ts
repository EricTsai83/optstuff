import { eq, and, isNull, desc } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { apiKeys, projects, teams } from "@/server/db/schema";
import { generateApiKey } from "@/server/lib/api-key";

export const apiKeyRouter = createTRPCRouter({
  /**
   * Create a new API key for a project.
   * Returns the full key only once - it should be shown to the user immediately.
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

      // Generate new API key
      const { key, keyPrefix, keyHash } = generateApiKey();

      // Insert into database
      const [newApiKey] = await db
        .insert(apiKeys)
        .values({
          projectId: input.projectId,
          name: input.name,
          keyPrefix,
          keyHash,
          expiresAt: input.expiresAt,
          rateLimitPerMinute: input.rateLimitPerMinute ?? 60,
          rateLimitPerDay: input.rateLimitPerDay ?? 10000,
        })
        .returning();

      // Return with full key (only time it's returned)
      return {
        ...newApiKey,
        key, // Full key - only returned on creation
      };
    }),

  /**
   * List all active API keys for a project.
   * Does NOT return the full key, only metadata.
   */
  list: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { userId, db } = ctx;

      // Verify user has access to the project
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, input.projectId),
        with: {
          team: true,
        },
      });

      if (!project || project.team.ownerId !== userId) {
        return [];
      }

      // Get all non-revoked API keys
      const keys = await db.query.apiKeys.findMany({
        where: and(
          eq(apiKeys.projectId, input.projectId),
          isNull(apiKeys.revokedAt),
        ),
        orderBy: [desc(apiKeys.createdAt)],
      });

      return keys;
    }),

  /**
   * List all API keys for a project, including revoked ones.
   */
  listAll: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { userId, db } = ctx;

      // Verify user has access to the project
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, input.projectId),
        with: {
          team: true,
        },
      });

      if (!project || project.team.ownerId !== userId) {
        return [];
      }

      const keys = await db.query.apiKeys.findMany({
        where: eq(apiKeys.projectId, input.projectId),
        orderBy: [desc(apiKeys.createdAt)],
      });

      return keys;
    }),

  /**
   * Get a specific API key by ID.
   */
  get: protectedProcedure
    .input(z.object({ apiKeyId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { userId, db } = ctx;

      const apiKey = await db.query.apiKeys.findFirst({
        where: eq(apiKeys.id, input.apiKeyId),
        with: {
          project: {
            with: {
              team: true,
            },
          },
        },
      });

      if (!apiKey || apiKey.project.team.ownerId !== userId) {
        return null;
      }

      return apiKey;
    }),

  /**
   * Revoke an API key.
   * The key will no longer be valid for API requests.
   */
  revoke: protectedProcedure
    .input(z.object({ apiKeyId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { userId, db } = ctx;

      // Get the API key with project and team info
      const apiKey = await db.query.apiKeys.findFirst({
        where: eq(apiKeys.id, input.apiKeyId),
        with: {
          project: {
            with: {
              team: true,
            },
          },
        },
      });

      if (!apiKey || apiKey.project.team.ownerId !== userId) {
        throw new Error("API key not found or access denied");
      }

      // Mark as revoked
      const [revokedKey] = await db
        .update(apiKeys)
        .set({ revokedAt: new Date() })
        .where(eq(apiKeys.id, input.apiKeyId))
        .returning();

      return revokedKey;
    }),

  /**
   * Rotate an API key - revoke the old one and create a new one.
   * Returns the new full key.
   */
  rotate: protectedProcedure
    .input(z.object({ apiKeyId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { userId, db } = ctx;

      // Get the old API key
      const oldApiKey = await db.query.apiKeys.findFirst({
        where: eq(apiKeys.id, input.apiKeyId),
        with: {
          project: {
            with: {
              team: true,
            },
          },
        },
      });

      if (!oldApiKey || oldApiKey.project.team.ownerId !== userId) {
        throw new Error("API key not found or access denied");
      }

      // Revoke the old key
      await db
        .update(apiKeys)
        .set({ revokedAt: new Date() })
        .where(eq(apiKeys.id, input.apiKeyId));

      // Generate new key
      const { key, keyPrefix, keyHash } = generateApiKey();

      // Create new API key with same settings
      const [newApiKey] = await db
        .insert(apiKeys)
        .values({
          projectId: oldApiKey.projectId,
          name: oldApiKey.name,
          keyPrefix,
          keyHash,
          expiresAt: oldApiKey.expiresAt,
          rateLimitPerMinute: oldApiKey.rateLimitPerMinute,
          rateLimitPerDay: oldApiKey.rateLimitPerDay,
        })
        .returning();

      return {
        ...newApiKey,
        key, // Full key - only returned on creation/rotation
      };
    }),

  /**
   * Update API key settings (name, rate limits, expiration).
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
      const { userId, db } = ctx;

      // Get the API key with project and team info
      const apiKey = await db.query.apiKeys.findFirst({
        where: eq(apiKeys.id, input.apiKeyId),
        with: {
          project: {
            with: {
              team: true,
            },
          },
        },
      });

      if (!apiKey || apiKey.project.team.ownerId !== userId) {
        throw new Error("API key not found or access denied");
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

      const [updatedKey] = await db
        .update(apiKeys)
        .set(updateData)
        .where(eq(apiKeys.id, input.apiKeyId))
        .returning();

      return updatedKey;
    }),

  /**
   * Update the last used timestamp for an API key.
   * Called by the API gateway when a key is used.
   */
  updateLastUsed: protectedProcedure
    .input(z.object({ apiKeyId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      await db
        .update(apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeys.id, input.apiKeyId));

      return { success: true };
    }),
});
