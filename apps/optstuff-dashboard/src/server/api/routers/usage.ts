import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { z } from "zod";

import { getDateRange, getToday } from "@/lib/format";
import {
  verifyProjectAccess,
  verifyTeamAccess,
} from "@/server/api/lib/access";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { apiKeys, projects, teams, usageRecords } from "@/server/db/schema";
import { getRedis } from "@/server/lib/redis";
import {
  getUsageBufferFlushStatus,
  flushUsageBufferToDatabase,
} from "@/server/lib/usage-tracker";

const MANUAL_USAGE_FLUSH_COOLDOWN_SECONDS = 60;

export const usageRouter = createTRPCRouter({
  /**
   * Record usage for a project/API key.
   * Called by the API gateway when processing requests.
   */
  record: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        apiKeyId: z.string().uuid().optional(),
        requestCount: z.number().int().min(0).default(1),
        bytesProcessed: z.number().int().min(0).default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyProjectAccess(ctx.db, input.projectId, ctx.userId);

      // If apiKeyId is provided, verify it belongs to the same project
      if (input.apiKeyId) {
        const apiKey = await ctx.db.query.apiKeys.findFirst({
          where: and(
            eq(apiKeys.id, input.apiKeyId),
            eq(apiKeys.projectId, input.projectId),
          ),
        });

        if (!apiKey) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "The specified API key does not belong to this project",
          });
        }
      }

      const today = getToday();

      // Use transaction to ensure atomic updates for both usage record and project totals
      const result = await ctx.db.transaction(async (tx) => {
        // Atomic upsert for usage record - eliminates race condition
        const [upsertedRecord] = await tx
          .insert(usageRecords)
          .values({
            projectId: input.projectId,
            apiKeyId: input.apiKeyId ?? null,
            date: today,
            requestCount: input.requestCount,
            bytesProcessed: input.bytesProcessed,
          })
          .onConflictDoUpdate({
            target: input.apiKeyId
              ? [usageRecords.projectId, usageRecords.apiKeyId, usageRecords.date]
              : [usageRecords.projectId, usageRecords.date],
            targetWhere: input.apiKeyId
              ? sql`${usageRecords.apiKeyId} IS NOT NULL`
              : sql`${usageRecords.apiKeyId} IS NULL`,
            set: {
              requestCount: sql`${usageRecords.requestCount} + ${input.requestCount}`,
              bytesProcessed: sql`${usageRecords.bytesProcessed} + ${input.bytesProcessed}`,
            },
          })
          .returning();

        // Update project's cached stats within the same transaction
        await tx
          .update(projects)
          .set({
            totalRequests: sql`${projects.totalRequests} + ${input.requestCount}`,
            totalBandwidth: sql`${projects.totalBandwidth} + ${input.bytesProcessed}`,
            lastActivityAt: new Date(),
          })
          .where(eq(projects.id, input.projectId));

        return upsertedRecord;
      });

      return result;
    }),

  /**
   * Get daily usage for a project within a date range.
   */
  getDailyUsage: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        startDate: z.string(),
        endDate: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await verifyProjectAccess(ctx.db, input.projectId, ctx.userId);

      const records = await ctx.db.query.usageRecords.findMany({
        where: and(
          eq(usageRecords.projectId, input.projectId),
          gte(usageRecords.date, input.startDate),
          lte(usageRecords.date, input.endDate),
        ),
        orderBy: [desc(usageRecords.date)],
      });

      // Aggregate by date
      const dailyUsage = records.reduce(
        (acc, record) => {
          const date = record.date;
          acc[date] ??= { date, requestCount: 0, bytesProcessed: 0 };
          acc[date].requestCount += record.requestCount;
          acc[date].bytesProcessed += record.bytesProcessed;
          return acc;
        },
        {} as Record<
          string,
          { date: string; requestCount: number; bytesProcessed: number }
        >,
      );

      return Object.values(dailyUsage).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
    }),

  /**
   * Get monthly usage summary for a project.
   */
  getMonthlyUsage: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        year: z.number().int(),
        month: z.number().int().min(1).max(12),
      }),
    )
    .query(async ({ ctx, input }) => {
      await verifyProjectAccess(ctx.db, input.projectId, ctx.userId);

      const startDate = `${input.year}-${String(input.month).padStart(2, "0")}-01`;
      const lastDay = new Date(input.year, input.month, 0).getDate();
      const endDate = `${input.year}-${String(input.month).padStart(2, "0")}-${lastDay}`;

      const records = await ctx.db.query.usageRecords.findMany({
        where: and(
          eq(usageRecords.projectId, input.projectId),
          gte(usageRecords.date, startDate),
          lte(usageRecords.date, endDate),
        ),
      });

      const totalRequests = records.reduce((sum, r) => sum + r.requestCount, 0);
      const totalBytes = records.reduce((sum, r) => sum + r.bytesProcessed, 0);

      return {
        year: input.year,
        month: input.month,
        totalRequests,
        totalBytes,
        daysWithUsage: new Set(records.map((r) => r.date)).size,
      };
    }),

  /**
   * Get usage summary for a project with previous period comparison.
   */
  getSummary: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        days: z.number().int().min(1).max(365).default(30),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await verifyProjectAccess(ctx.db, input.projectId, ctx.userId);

      let startDate: string;
      let endDate: string;
      let days: number;

      if (input.startDate && input.endDate) {
        startDate = input.startDate.split("T")[0]!;
        endDate = input.endDate.split("T")[0]!;
        const msPerDay = 1000 * 60 * 60 * 24;
        days = Math.max(
          1,
          Math.ceil(
            (new Date(endDate).getTime() - new Date(startDate).getTime()) /
              msPerDay,
          ),
        );
      } else {
        ({ startDate, endDate } = getDateRange(input.days));
        days = input.days;
      }

      const msPerDay = 1000 * 60 * 60 * 24;
      const prevEndDay = new Date(
        new Date(startDate).getTime() - msPerDay,
      );
      const prevStartDay = new Date(
        prevEndDay.getTime() - days * msPerDay,
      );
      const prevStartDate = prevStartDay.toISOString().split("T")[0]!;
      const prevEndDate = prevEndDay.toISOString().split("T")[0]!;

      const [records, prevRecords] = await Promise.all([
        ctx.db.query.usageRecords.findMany({
          where: and(
            eq(usageRecords.projectId, input.projectId),
            gte(usageRecords.date, startDate),
            lte(usageRecords.date, endDate),
          ),
        }),
        ctx.db.query.usageRecords.findMany({
          where: and(
            eq(usageRecords.projectId, input.projectId),
            gte(usageRecords.date, prevStartDate),
            lte(usageRecords.date, prevEndDate),
          ),
        }),
      ]);

      const totalRequests = records.reduce((sum, r) => sum + r.requestCount, 0);
      const totalBytes = records.reduce((sum, r) => sum + r.bytesProcessed, 0);
      const prevTotalRequests = prevRecords.reduce(
        (sum, r) => sum + r.requestCount,
        0,
      );
      const prevTotalBytes = prevRecords.reduce(
        (sum, r) => sum + r.bytesProcessed,
        0,
      );

      return {
        days,
        startDate,
        endDate,
        totalRequests,
        totalBytes,
        averageDailyRequests: Math.round(totalRequests / days),
        averageDailyBytes: Math.round(totalBytes / days),
        previousPeriod: {
          totalRequests: prevTotalRequests,
          totalBytes: prevTotalBytes,
        },
      };
    }),

  /**
   * Get usage metering freshness information for dashboard display.
   */
  getMeteringStatus: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await verifyProjectAccess(ctx.db, input.projectId, ctx.userId);

      const flushStatus = await getUsageBufferFlushStatus();

      return {
        lastFlushRunAt: flushStatus.lastFlushRunAt,
        lastFlushSuccessAt: flushStatus.lastFlushSuccessAt,
      };
    }),

  /**
   * Manually flush buffered usage counters into `usage_record`.
   *
   * The action is project-scoped for authorization but the flush itself is
   * global, since usage buckets are shared across all projects.
   */
  flushNow: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyProjectAccess(ctx.db, input.projectId, ctx.userId);

      const redis = getRedis();
      const cooldownKey = `usage:buffer:manual-trigger:${ctx.userId}`;
      const cooldownResult = await redis.set(cooldownKey, "1", {
        nx: true,
        ex: MANUAL_USAGE_FLUSH_COOLDOWN_SECONDS,
      });

      if (cooldownResult !== "OK") {
        return {
          ok: false as const,
          reason: "cooldown" as const,
          cooldownSeconds: MANUAL_USAGE_FLUSH_COOLDOWN_SECONDS,
        };
      }

      const flushResult = await flushUsageBufferToDatabase();
      return {
        ok: flushResult.ok,
        reason: "executed" as const,
        cooldownSeconds: 0,
        flushResult,
      };
    }),

  /**
   * Get usage breakdown by API key for a project.
   */
  getByApiKey: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        startDate: z.string(),
        endDate: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await verifyProjectAccess(ctx.db, input.projectId, ctx.userId);

      const records = await ctx.db.query.usageRecords.findMany({
        where: and(
          eq(usageRecords.projectId, input.projectId),
          gte(usageRecords.date, input.startDate),
          lte(usageRecords.date, input.endDate),
        ),
        with: { apiKey: true },
      });

      const byApiKey = records.reduce(
        (acc, record) => {
          const keyId = record.apiKeyId ?? "unknown";
          const keyName = record.apiKey?.name ?? "Unknown";
          const publicKey = record.apiKey?.publicKey ?? "???";

          acc[keyId] ??= {
            apiKeyId: keyId,
            name: keyName,
            publicKey,
            requestCount: 0,
            bytesProcessed: 0,
          };
          acc[keyId].requestCount += record.requestCount;
          acc[keyId].bytesProcessed += record.bytesProcessed;
          return acc;
        },
        {} as Record<
          string,
          {
            apiKeyId: string;
            name: string;
            publicKey: string;
            requestCount: number;
            bytesProcessed: number;
          }
        >,
      );

      return Object.values(byApiKey).sort(
        (a, b) => b.requestCount - a.requestCount,
      );
    }),

  /**
   * Get overall usage summary for a team.
   */
  getTeamSummary: protectedProcedure
    .input(z.object({ teamId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await verifyTeamAccess(ctx.db, input.teamId, ctx.userId);

      // Get all projects for this team
      const teamProjects = await ctx.db.query.projects.findMany({
        where: eq(projects.teamId, input.teamId),
      });

      if (teamProjects.length === 0) {
        return {
          period: "last_30_days",
          totalRequests: 0,
          totalBytes: 0,
          projectCount: 0,
        };
      }

      const { startDate, endDate } = getDateRange(30);

      // Single query with inArray to get all usage records
      const projectIds = teamProjects.map((p) => p.id);
      const records = await ctx.db.query.usageRecords.findMany({
        where: and(
          inArray(usageRecords.projectId, projectIds),
          gte(usageRecords.date, startDate),
          lte(usageRecords.date, endDate),
        ),
      });

      const totalRequests = records.reduce((sum, r) => sum + r.requestCount, 0);
      const totalBytes = records.reduce((sum, r) => sum + r.bytesProcessed, 0);

      return {
        period: "last_30_days",
        totalRequests,
        totalBytes,
        projectCount: teamProjects.length,
      };
    }),

  /**
   * Get overall usage summary across all teams the user owns.
   */
  getAllTeamsSummary: protectedProcedure.query(async ({ ctx }) => {
    // Get all teams the user owns
    const userTeams = await ctx.db.query.teams.findMany({
      where: eq(teams.ownerId, ctx.userId),
    });

    if (userTeams.length === 0) {
      return {
        period: "last_30_days",
        totalRequests: 0,
        totalBytes: 0,
        teamCount: 0,
        projectCount: 0,
      };
    }

    const teamIds = userTeams.map((t) => t.id);

    // Get all projects for these teams
    const allProjects = await ctx.db.query.projects.findMany({
      where: inArray(projects.teamId, teamIds),
    });

    if (allProjects.length === 0) {
      return {
        period: "last_30_days",
        totalRequests: 0,
        totalBytes: 0,
        teamCount: userTeams.length,
        projectCount: 0,
      };
    }

    const { startDate, endDate } = getDateRange(30);

    // Single query with inArray
    const projectIds = allProjects.map((p) => p.id);
    const records = await ctx.db.query.usageRecords.findMany({
      where: and(
        inArray(usageRecords.projectId, projectIds),
        gte(usageRecords.date, startDate),
        lte(usageRecords.date, endDate),
      ),
    });

    const totalRequests = records.reduce((sum, r) => sum + r.requestCount, 0);
    const totalBytes = records.reduce((sum, r) => sum + r.bytesProcessed, 0);

    return {
      period: "last_30_days",
      totalRequests,
      totalBytes,
      teamCount: userTeams.length,
      projectCount: allProjects.length,
    };
  }),
});
