import { and, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { z } from "zod";

import { verifyProjectAccess } from "@/server/api/lib/access";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { requestLogs } from "@/server/db/schema";

const DATE_ONLY_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Accepts ISO date-only and full ISO datetime strings.
 */
const zDateString = z.string().refine(
  (value) => !Number.isNaN(Date.parse(value)),
  "Invalid ISO date/datetime string",
);

/**
 * Parses an input date string and throws for invalid values.
 */
function parseDateInput(value: string): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date string: ${value}`);
  }
  return parsed;
}

/**
 * Converts user end-date input to an exclusive upper bound.
 * Date-only values are interpreted as inclusive UTC day endpoints
 * and converted to next-day `00:00:00.000Z`; datetime values are used as-is.
 */
function toEndExclusive(value: string): Date {
  const dateOnlyMatch = DATE_ONLY_REGEX.exec(value);
  if (dateOnlyMatch) {
    const year = Number.parseInt(dateOnlyMatch[1] ?? "0", 10);
    const month = Number.parseInt(dateOnlyMatch[2] ?? "0", 10);
    const day = Number.parseInt(dateOnlyMatch[3] ?? "0", 10);

    return new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0));
  }

  return parseDateInput(value);
}

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

      const endExclusive = toEndExclusive(input.endDate);
      const conditions = [
        eq(requestLogs.projectId, input.projectId),
        gte(requestLogs.createdAt, parseDateInput(input.startDate)),
        lt(requestLogs.createdAt, endExclusive),
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
   * Get usage summary from request logs with previous-period comparison.
   */
  getSummary: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        startDate: zDateString,
        endDate: zDateString,
      }),
    )
    .query(async ({ ctx, input }) => {
      await verifyProjectAccess(ctx.db, input.projectId, ctx.userId);

      const startInclusive = parseDateInput(input.startDate);
      const endExclusive = toEndExclusive(input.endDate);
      const rangeDurationMs = Math.max(
        1,
        endExclusive.getTime() - startInclusive.getTime(),
      );

      const previousStartInclusive = new Date(
        startInclusive.getTime() - rangeDurationMs,
      );
      const previousEndExclusive = startInclusive;

      const queryTotals = async (from: Date, to: Date) => {
        const result = await ctx.db
          .select({
            totalRequests: sql<number>`count(*)::int`.as("total_requests"),
            totalBytes:
              sql<number>`coalesce(sum(${requestLogs.optimizedSize}), 0)::bigint`.as(
                "total_bytes",
              ),
          })
          .from(requestLogs)
          .where(
            and(
              eq(requestLogs.projectId, input.projectId),
              gte(requestLogs.createdAt, from),
              lt(requestLogs.createdAt, to),
            ),
          );

        const totals = result[0];
        return {
          totalRequests: totals?.totalRequests ?? 0,
          totalBytes: Number(totals?.totalBytes ?? 0),
        };
      };

      const [current, previous] = await Promise.all([
        queryTotals(startInclusive, endExclusive),
        queryTotals(previousStartInclusive, previousEndExclusive),
      ]);

      const msPerDay = 1000 * 60 * 60 * 24;
      const days = Math.max(1, Math.ceil(rangeDurationMs / msPerDay));

      return {
        days,
        startDate: input.startDate,
        endDate: input.endDate,
        totalRequests: current.totalRequests,
        totalBytes: current.totalBytes,
        averageDailyRequests: Math.round(current.totalRequests / days),
        averageDailyBytes: Math.round(current.totalBytes / days),
        previousPeriod: {
          totalRequests: previous.totalRequests,
          totalBytes: previous.totalBytes,
        },
      };
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
      const utcDateExpr = sql`date(timezone('UTC', ${requestLogs.createdAt}))`;

      const result = await ctx.db
        .select({
          date: sql<string>`${utcDateExpr}`.as("date"),
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
            gte(requestLogs.createdAt, parseDateInput(input.startDate)),
            lt(requestLogs.createdAt, toEndExclusive(input.endDate)),
          ),
        )
        .groupBy(utcDateExpr)
        .orderBy(utcDateExpr);

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
            gte(requestLogs.createdAt, parseDateInput(input.startDate)),
            lt(requestLogs.createdAt, toEndExclusive(input.endDate)),
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
          pairedSizeSamples:
            sql<number>`count(*) filter (where ${requestLogs.status} = 'success' and ${requestLogs.originalSize} is not null and ${requestLogs.optimizedSize} is not null)::int`.as(
              "paired_size_samples",
            ),
          totalOriginalSize:
            sql<number>`coalesce(sum(${requestLogs.originalSize}) filter (where ${requestLogs.status} = 'success' and ${requestLogs.originalSize} is not null and ${requestLogs.optimizedSize} is not null), 0)::bigint`.as(
              "total_original_size",
            ),
          totalOptimizedSize:
            sql<number>`coalesce(sum(${requestLogs.optimizedSize}) filter (where ${requestLogs.status} = 'success' and ${requestLogs.originalSize} is not null and ${requestLogs.optimizedSize} is not null), 0)::bigint`.as(
              "total_optimized_size",
            ),
          avgProcessingTimeMs:
            sql<number | null>`round(avg(${requestLogs.processingTimeMs}))::int`.as(
              "avg_processing_time_ms",
            ),
        })
        .from(requestLogs)
        .where(
          and(
            eq(requestLogs.projectId, input.projectId),
            gte(requestLogs.createdAt, parseDateInput(input.startDate)),
            lt(requestLogs.createdAt, toEndExclusive(input.endDate)),
          ),
        );

      const stats = result[0];
      if (!stats) {
        return {
          totalRequests: 0,
          successfulRequests: 0,
          pairedSizeSamples: 0,
          sampleCoveragePercentage: 0,
          isEstimated: false,
          totalOriginalSize: 0,
          totalOptimizedSize: 0,
          bandwidthSaved: 0,
          savingsPercentage: 0,
          avgProcessingTimeMs: null as number | null,
        };
      }

      const originalSize = Number(stats.totalOriginalSize);
      const optimizedSize = Number(stats.totalOptimizedSize);
      const bandwidthSaved = originalSize - optimizedSize;
      const savingsPercentage =
        originalSize > 0 ? (bandwidthSaved / originalSize) * 100 : 0;
      const sampleCoveragePercentage =
        stats.successfulRequests > 0
          ? (stats.pairedSizeSamples / stats.successfulRequests) * 100
          : 0;

      return {
        totalRequests: stats.totalRequests,
        successfulRequests: stats.successfulRequests,
        pairedSizeSamples: stats.pairedSizeSamples,
        sampleCoveragePercentage: Math.round(sampleCoveragePercentage * 10) / 10,
        isEstimated: stats.pairedSizeSamples < stats.successfulRequests,
        totalOriginalSize: originalSize,
        totalOptimizedSize: optimizedSize,
        bandwidthSaved,
        savingsPercentage: Math.round(savingsPercentage * 10) / 10,
        avgProcessingTimeMs: stats.avgProcessingTimeMs,
      };
    }),
});
