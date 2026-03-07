import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { z } from "zod";

import { verifyProjectAccess } from "@/server/api/lib/access";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { requestLogs } from "@/server/db/schema";

const zDateString = z
  .string()
  .refine((v) => !isNaN(Date.parse(v)), { message: "Invalid date string" });

export const requestLogRouter = createTRPCRouter({
  /**
   * Get the most recent request logs for a project,
   * optionally filtered by status before applying the row cap.
   */
  getRecentLogs: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        startDate: zDateString,
        endDate: zDateString,
        limit: z.number().int().min(1).max(100).default(20),
        statuses: z.array(z.string()).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await verifyProjectAccess(ctx.db, input.projectId, ctx.userId);

      const conditions = [
        eq(requestLogs.projectId, input.projectId),
        gte(requestLogs.createdAt, new Date(input.startDate)),
        lte(requestLogs.createdAt, new Date(input.endDate)),
      ];
      if (input.statuses && input.statuses.length > 0) {
        conditions.push(inArray(requestLogs.status, input.statuses));
      }

      const logs = await ctx.db.query.requestLogs.findMany({
        where: and(...conditions),
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
   * Get daily request volume aggregated from request logs.
   */
  getDailyVolume: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        startDate: zDateString,
        endDate: zDateString,
      }),
    )
    .query(async ({ ctx, input }) => {
      await verifyProjectAccess(ctx.db, input.projectId, ctx.userId);

      const result = await ctx.db
        .select({
          date: sql<string>`date(${requestLogs.createdAt})`.as("date"),
          requestCount: sql<number>`count(*)::int`.as("request_count"),
          bytesProcessed:
            sql<number>`coalesce(sum(${requestLogs.optimizedSize}), 0)::bigint`.as(
              "bytes_processed",
            ),
        })
        .from(requestLogs)
        .where(
          and(
            eq(requestLogs.projectId, input.projectId),
            gte(requestLogs.createdAt, new Date(input.startDate)),
            lte(requestLogs.createdAt, new Date(input.endDate)),
          ),
        )
        .groupBy(sql`date(${requestLogs.createdAt})`)
        .orderBy(sql`date(${requestLogs.createdAt})`);

      return result.map((r) => ({
        date: r.date,
        requestCount: r.requestCount,
        bytesProcessed: Number(r.bytesProcessed),
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
        startDate: zDateString,
        endDate: zDateString,
        limit: z.number().int().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      await verifyProjectAccess(ctx.db, input.projectId, ctx.userId);

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
        .where(
          and(
            eq(requestLogs.projectId, input.projectId),
            gte(requestLogs.createdAt, new Date(input.startDate)),
            lte(requestLogs.createdAt, new Date(input.endDate)),
          ),
        )
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
    .input(
      z.object({
        projectId: z.string().uuid(),
        startDate: zDateString,
        endDate: zDateString,
      }),
    )
    .query(async ({ ctx, input }) => {
      await verifyProjectAccess(ctx.db, input.projectId, ctx.userId);

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
          avgProcessingTimeMs:
            sql<number>`coalesce(round(avg(${requestLogs.processingTimeMs}))::int, 0)`.as(
              "avg_processing_time_ms",
            ),
        })
        .from(requestLogs)
        .where(
          and(
            eq(requestLogs.projectId, input.projectId),
            gte(requestLogs.createdAt, new Date(input.startDate)),
            lte(requestLogs.createdAt, new Date(input.endDate)),
          ),
        );

      const stats = result[0];
      if (!stats) {
        return {
          totalRequests: 0,
          successfulRequests: 0,
          totalOriginalSize: 0,
          totalOptimizedSize: 0,
          bandwidthSaved: 0,
          savingsPercentage: 0,
          avgProcessingTimeMs: 0,
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
        avgProcessingTimeMs: stats.avgProcessingTimeMs,
      };
    }),
});
