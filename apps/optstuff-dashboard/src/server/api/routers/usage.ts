import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { usageRecords, projects, teams, apiKeys } from "@/server/db/schema";

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
      const { db } = ctx;
      const today = new Date().toISOString().split("T")[0]!;

      // Try to update existing record for today
      const existingRecord = await db.query.usageRecords.findFirst({
        where: and(
          eq(usageRecords.projectId, input.projectId),
          input.apiKeyId
            ? eq(usageRecords.apiKeyId, input.apiKeyId)
            : sql`${usageRecords.apiKeyId} IS NULL`,
          eq(usageRecords.date, today),
        ),
      });

      if (existingRecord) {
        // Update existing record
        const [updated] = await db
          .update(usageRecords)
          .set({
            requestCount: sql`${usageRecords.requestCount} + ${input.requestCount}`,
            bytesProcessed: sql`${usageRecords.bytesProcessed} + ${input.bytesProcessed}`,
          })
          .where(eq(usageRecords.id, existingRecord.id))
          .returning();

        return updated;
      }

      // Create new record
      const [newRecord] = await db
        .insert(usageRecords)
        .values({
          projectId: input.projectId,
          apiKeyId: input.apiKeyId,
          date: today,
          requestCount: input.requestCount,
          bytesProcessed: input.bytesProcessed,
        })
        .returning();

      return newRecord;
    }),

  /**
   * Get daily usage for a project within a date range.
   */
  getDailyUsage: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        startDate: z.string(), // YYYY-MM-DD
        endDate: z.string(), // YYYY-MM-DD
      }),
    )
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

      const records = await db.query.usageRecords.findMany({
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
          if (!acc[date]) {
            acc[date] = { date, requestCount: 0, bytesProcessed: 0 };
          }
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
      const { userId, db } = ctx;

      // Verify user has access to the project
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, input.projectId),
        with: {
          team: true,
        },
      });

      if (!project || project.team.ownerId !== userId) {
        return null;
      }

      // Calculate date range for the month
      const startDate = `${input.year}-${String(input.month).padStart(2, "0")}-01`;
      const lastDay = new Date(input.year, input.month, 0).getDate();
      const endDate = `${input.year}-${String(input.month).padStart(2, "0")}-${lastDay}`;

      const records = await db.query.usageRecords.findMany({
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
   * Get usage summary for a project (last 30 days).
   */
  getSummary: protectedProcedure
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
        return null;
      }

      // Last 30 days
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const startDate = thirtyDaysAgo.toISOString().split("T")[0]!;
      const endDate = today.toISOString().split("T")[0]!;

      const records = await db.query.usageRecords.findMany({
        where: and(
          eq(usageRecords.projectId, input.projectId),
          gte(usageRecords.date, startDate),
          lte(usageRecords.date, endDate),
        ),
      });

      const totalRequests = records.reduce((sum, r) => sum + r.requestCount, 0);
      const totalBytes = records.reduce((sum, r) => sum + r.bytesProcessed, 0);

      return {
        period: "last_30_days",
        startDate,
        endDate,
        totalRequests,
        totalBytes,
        averageDailyRequests: Math.round(totalRequests / 30),
        averageDailyBytes: Math.round(totalBytes / 30),
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

      const records = await db.query.usageRecords.findMany({
        where: and(
          eq(usageRecords.projectId, input.projectId),
          gte(usageRecords.date, input.startDate),
          lte(usageRecords.date, input.endDate),
        ),
        with: {
          apiKey: true,
        },
      });

      // Aggregate by API key
      const byApiKey = records.reduce(
        (acc, record) => {
          const keyId = record.apiKeyId ?? "unknown";
          const keyName = record.apiKey?.name ?? "Unknown";
          const keyPrefix = record.apiKey?.keyPrefix ?? "???";

          if (!acc[keyId]) {
            acc[keyId] = {
              apiKeyId: keyId,
              name: keyName,
              keyPrefix,
              requestCount: 0,
              bytesProcessed: 0,
            };
          }
          acc[keyId].requestCount += record.requestCount;
          acc[keyId].bytesProcessed += record.bytesProcessed;
          return acc;
        },
        {} as Record<
          string,
          {
            apiKeyId: string;
            name: string;
            keyPrefix: string;
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
   * Get overall usage summary for a team (across all projects).
   */
  getTeamSummary: protectedProcedure
    .input(z.object({ teamId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { userId, db } = ctx;

      // Verify user has access to the team
      const team = await db.query.teams.findFirst({
        where: and(eq(teams.id, input.teamId), eq(teams.ownerId, userId)),
      });

      if (!team) {
        return null;
      }

      // Get all projects in the team
      const teamProjects = await db.query.projects.findMany({
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

      // Last 30 days
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const startDate = thirtyDaysAgo.toISOString().split("T")[0]!;
      const endDate = today.toISOString().split("T")[0]!;

      // Get usage for all projects
      const projectIds = teamProjects.map((p) => p.id);

      let totalRequests = 0;
      let totalBytes = 0;

      for (const projectId of projectIds) {
        const records = await db.query.usageRecords.findMany({
          where: and(
            eq(usageRecords.projectId, projectId),
            gte(usageRecords.date, startDate),
            lte(usageRecords.date, endDate),
          ),
        });

        totalRequests += records.reduce((sum, r) => sum + r.requestCount, 0);
        totalBytes += records.reduce((sum, r) => sum + r.bytesProcessed, 0);
      }

      return {
        period: "last_30_days",
        totalRequests,
        totalBytes,
        projectCount: teamProjects.length,
      };
    }),
});
