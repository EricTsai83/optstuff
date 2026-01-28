import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import type { db as dbType } from "@/server/db";
import { projects, requestLogs } from "@/server/db/schema";

/**
 * Helper to verify user owns the project's team.
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

export const requestLogRouter = createTRPCRouter({
  /**
   * Get the most recent request logs for a project.
   * Returns the last 20 requests.
   */
  getRecentLogs: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        limit: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const project = await verifyProjectAccess(
        ctx.db,
        input.projectId,
        ctx.userId,
      );

      if (!project) {
        return [];
      }

      const logs = await ctx.db.query.requestLogs.findMany({
        where: eq(requestLogs.projectId, input.projectId),
        orderBy: [desc(requestLogs.createdAt)],
        limit: input.limit,
      });

      return logs.map((log) => ({
        id: log.id,
        sourceUrl: log.sourceUrl,
        status: log.status,
        processingTimeMs: log.processingTimeMs,
        originalSize: log.originalSize,
        optimizedSize: log.optimizedSize,
        createdAt: log.createdAt,
      }));
    }),

  /**
   * Get the top requested images for a project.
   * Returns the top 10 most requested image URLs.
   */
  getTopImages: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        limit: z.number().int().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const project = await verifyProjectAccess(
        ctx.db,
        input.projectId,
        ctx.userId,
      );

      if (!project) {
        return [];
      }

      // Aggregate by sourceUrl to get request counts
      const result = await ctx.db
        .select({
          sourceUrl: requestLogs.sourceUrl,
          requestCount: sql<number>`count(*)::int`.as("request_count"),
          totalOptimizedSize:
            sql<number>`coalesce(sum(${requestLogs.optimizedSize}), 0)::bigint`.as(
              "total_optimized_size",
            ),
        })
        .from(requestLogs)
        .where(eq(requestLogs.projectId, input.projectId))
        .groupBy(requestLogs.sourceUrl)
        .orderBy(sql`count(*) desc`)
        .limit(input.limit);

      return result;
    }),

  /**
   * Get bandwidth savings statistics for a project.
   * Compares original size vs optimized size.
   */
  getBandwidthSavings: protectedProcedure
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

      // Get aggregated bandwidth stats
      const result = await ctx.db
        .select({
          totalRequests: sql<number>`count(*)::int`.as("total_requests"),
          successfulRequests:
            sql<number>`count(*) filter (where ${requestLogs.status} = 'success')::int`.as(
              "successful_requests",
            ),
          totalOriginalSize:
            sql<number>`coalesce(sum(${requestLogs.originalSize}), 0)::bigint`.as(
              "total_original_size",
            ),
          totalOptimizedSize:
            sql<number>`coalesce(sum(${requestLogs.optimizedSize}), 0)::bigint`.as(
              "total_optimized_size",
            ),
        })
        .from(requestLogs)
        .where(eq(requestLogs.projectId, input.projectId));

      const stats = result[0];
      if (!stats) {
        return {
          totalRequests: 0,
          successfulRequests: 0,
          totalOriginalSize: 0,
          totalOptimizedSize: 0,
          bandwidthSaved: 0,
          savingsPercentage: 0,
        };
      }

      const originalSize = Number(stats.totalOriginalSize);
      const optimizedSize = Number(stats.totalOptimizedSize);
      // Clamp to non-negative to handle cases where optimized > original
      const bandwidthSaved = Math.max(0, originalSize - optimizedSize);
      const savingsPercentage =
        originalSize > 0 ? (bandwidthSaved / originalSize) * 100 : 0;

      return {
        totalRequests: stats.totalRequests,
        successfulRequests: stats.successfulRequests,
        totalOriginalSize: originalSize,
        totalOptimizedSize: optimizedSize,
        bandwidthSaved,
        savingsPercentage: Math.round(savingsPercentage * 10) / 10,
      };
    }),
});
