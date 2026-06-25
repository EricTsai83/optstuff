import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { z } from "zod";

import { getDateRange } from "@/lib/format";
import { verifyProjectAccess, verifyTeamAccess } from "@/server/api/lib/access";
import {
  addAnalyticsDateRangeIssue,
  analyticsDateRangeFields,
  getAnalyticsDateRange,
  zDateString,
} from "@/server/api/lib/date-range";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { projects, teams, usageRecords } from "@/server/db/schema";
import { getUsageBufferFlushStatus } from "@/server/lib/usage-tracker";

export const usageRouter = createTRPCRouter({
  /**
   * Get daily usage for a project within a date range.
   */
  getDailyUsage: protectedProcedure
    .input(
      z
        .object({
          projectId: z.string().uuid(),
          ...analyticsDateRangeFields,
        })
        .superRefine((value, ctx) => addAnalyticsDateRangeIssue(value, ctx)),
    )
    .query(async ({ ctx, input }) => {
      await verifyProjectAccess(ctx.db, input.projectId, ctx.userId);
      const range = getAnalyticsDateRange(input);

      const records = await ctx.db.query.usageRecords.findMany({
        where: and(
          eq(usageRecords.projectId, input.projectId),
          gte(usageRecords.date, range.startDate),
          lte(usageRecords.date, range.endDate),
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
      z
        .object({
          projectId: z.string().uuid(),
          days: z.number().int().min(1).max(90).default(30),
          startDate: zDateString.optional(),
          endDate: zDateString.optional(),
        })
        .superRefine((value, ctx) => {
          if (
            (value.startDate && !value.endDate) ||
            (!value.startDate && value.endDate)
          ) {
            ctx.addIssue({
              code: "custom",
              message: "startDate and endDate must be provided together",
            });
            return;
          }

          if (value.startDate && value.endDate) {
            addAnalyticsDateRangeIssue(
              { startDate: value.startDate, endDate: value.endDate },
              ctx,
            );
          }
        }),
    )
    .query(async ({ ctx, input }) => {
      await verifyProjectAccess(ctx.db, input.projectId, ctx.userId);

      let startDate: string;
      let endDate: string;
      let days: number;

      if (input.startDate && input.endDate) {
        const range = getAnalyticsDateRange({
          startDate: input.startDate,
          endDate: input.endDate,
        });
        startDate = range.startDate;
        endDate = range.endDate;
        days = range.days;
      } else {
        ({ startDate, endDate } = getDateRange(input.days));
        days = input.days;
      }

      const msPerDay = 1000 * 60 * 60 * 24;
      const prevEndDay = new Date(new Date(startDate).getTime() - msPerDay);
      const prevStartDay = new Date(prevEndDay.getTime() - days * msPerDay);
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
   * Refresh usage metering status for dashboard display.
   * Global usage flush execution is reserved for the cron/service path.
   */
  flushNow: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyProjectAccess(ctx.db, input.projectId, ctx.userId);

      const meteringStatus = await getUsageBufferFlushStatus();
      return {
        ok: true as const,
        reason: "refreshed" as const,
        cooldownSeconds: 0,
        meteringStatus,
      };
    }),

  /**
   * Get usage breakdown by API key for a project.
   */
  getByApiKey: protectedProcedure
    .input(
      z
        .object({
          projectId: z.string().uuid(),
          ...analyticsDateRangeFields,
        })
        .superRefine((value, ctx) => addAnalyticsDateRangeIssue(value, ctx)),
    )
    .query(async ({ ctx, input }) => {
      await verifyProjectAccess(ctx.db, input.projectId, ctx.userId);
      const range = getAnalyticsDateRange(input);

      const records = await ctx.db.query.usageRecords.findMany({
        where: and(
          eq(usageRecords.projectId, input.projectId),
          gte(usageRecords.date, range.startDate),
          lte(usageRecords.date, range.endDate),
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
