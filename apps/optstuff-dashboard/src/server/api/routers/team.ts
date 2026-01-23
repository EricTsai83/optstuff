import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { teams } from "@/server/db/schema";
import { generateSlug, generateUniqueSlug } from "@/lib/slug";

export const teamRouter = createTRPCRouter({
  /**
   * Get or create the user's personal team.
   */
  ensurePersonalTeam: protectedProcedure.mutation(async ({ ctx }) => {
    const { userId, db } = ctx;

    // Check if user already has a personal team
    const existingTeam = await db.query.teams.findFirst({
      where: and(eq(teams.ownerId, userId), eq(teams.isPersonal, true)),
    });

    if (existingTeam) return existingTeam;

    // Create personal team
    const personalSlug = `${userId.replace("user_", "")}-personal`;

    const [newTeam] = await db
      .insert(teams)
      .values({
        ownerId: userId,
        name: "Personal Team",
        slug: personalSlug,
        isPersonal: true,
      })
      .onConflictDoNothing()
      .returning();

    if (newTeam) return newTeam;

    // If conflict, find existing personal team
    return (
      (await db.query.teams.findFirst({
        where: and(eq(teams.ownerId, userId), eq(teams.isPersonal, true)),
      })) ?? null
    );
  }),

  /**
   * Get the user's personal team.
   */
  getPersonalTeam: protectedProcedure.query(async ({ ctx }) => {
    const { userId, db } = ctx;
    return (
      (await db.query.teams.findFirst({
        where: and(eq(teams.ownerId, userId), eq(teams.isPersonal, true)),
      })) ?? null
    );
  }),

  /**
   * List all teams the user owns.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const userTeams = await ctx.db.query.teams.findMany({
      where: eq(teams.ownerId, ctx.userId),
      orderBy: [desc(teams.createdAt)],
    });

    // Add role to each team (owner for all since we only support single owner now)
    const teamsWithRole = userTeams.map((team) => ({
      ...team,
      role: "org:admin" as const,
    }));

    // Sort: personal teams first, then by createdAt descending
    return teamsWithRole.sort((a, b) => {
      if (a.isPersonal && !b.isPersonal) return -1;
      if (!a.isPersonal && b.isPersonal) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }),

  /**
   * Get a specific team by ID.
   * Verifies the user owns the team.
   */
  get: protectedProcedure
    .input(z.object({ teamId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const team = await ctx.db.query.teams.findFirst({
        where: eq(teams.id, input.teamId),
      });

      // Verify the user owns this team
      if (!team || team.ownerId !== ctx.userId) {
        return null;
      }

      return team;
    }),

  /**
   * Get a team by its slug.
   * Verifies the user owns the team.
   */
  getBySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const team = await ctx.db.query.teams.findFirst({
        where: eq(teams.slug, input.slug),
      });

      // Verify the user owns this team
      if (!team || team.ownerId !== ctx.userId) {
        return null;
      }

      return team;
    }),

  /**
   * Create a new team with custom slug.
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        slug: z
          .string()
          .min(3)
          .max(50)
          .regex(
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            "Slug must be lowercase letters, numbers, and hyphens only",
          ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if slug already exists
      const existingTeam = await ctx.db.query.teams.findFirst({
        where: eq(teams.slug, input.slug),
      });

      if (existingTeam) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This slug is already taken. Please choose a different one.",
        });
      }

      // Create local team record
      const [newTeam] = await ctx.db
        .insert(teams)
        .values({
          ownerId: ctx.userId,
          name: input.name,
          slug: input.slug,
          isPersonal: false,
        })
        .returning();

      return newTeam;
    }),

  /**
   * Check if a slug is available.
   */
  checkSlugAvailable: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const existingTeam = await ctx.db.query.teams.findFirst({
        where: eq(teams.slug, input.slug),
      });
      return { available: !existingTeam };
    }),

  /**
   * Update a team's name.
   * Only the owner can update.
   */
  update: protectedProcedure
    .input(
      z.object({
        teamId: z.string().uuid(),
        name: z.string().min(1).max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user owns this team
      const team = await ctx.db.query.teams.findFirst({
        where: eq(teams.id, input.teamId),
      });

      if (!team || team.ownerId !== ctx.userId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" });
      }

      // Update local DB
      const [updatedTeam] = await ctx.db
        .update(teams)
        .set({ name: input.name })
        .where(eq(teams.id, input.teamId))
        .returning();

      return updatedTeam ?? null;
    }),

  /**
   * Delete a team (non-personal only).
   * Only the owner can delete.
   */
  delete: protectedProcedure
    .input(z.object({ teamId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify user owns this team
      const team = await ctx.db.query.teams.findFirst({
        where: eq(teams.id, input.teamId),
      });

      if (!team || team.ownerId !== ctx.userId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" });
      }

      if (team.isPersonal) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete personal team",
        });
      }

      // Delete local record
      await ctx.db.delete(teams).where(eq(teams.id, input.teamId));
      return { success: true };
    }),
});
