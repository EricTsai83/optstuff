import { eq, and } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { teams } from "@/server/db/schema";
import { generateSlug, generateUniqueSlug } from "@/lib/slug";

export const teamRouter = createTRPCRouter({
  /**
   * Get or create the user's personal team.
   */
  ensurePersonalTeam: protectedProcedure.mutation(async ({ ctx }) => {
    const { userId, db } = ctx;

    const existingTeam = await db.query.teams.findFirst({
      where: and(eq(teams.ownerId, userId), eq(teams.isPersonal, true)),
    });

    if (existingTeam) return existingTeam;

    const [newTeam] = await db
      .insert(teams)
      .values({
        ownerId: userId,
        name: "Personal Team",
        slug: `personal-${userId.toLowerCase().slice(0, 8)}-${Date.now()}`,
        isPersonal: true,
      })
      .returning();

    return newTeam;
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
   * List all teams the user has access to.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.teams.findMany({
      where: eq(teams.ownerId, ctx.userId),
      orderBy: (t, { desc }) => [desc(t.isPersonal), desc(t.createdAt)],
    });
  }),

  /**
   * Get a specific team by ID.
   */
  get: protectedProcedure
    .input(z.object({ teamId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return (
        (await ctx.db.query.teams.findFirst({
          where: and(eq(teams.id, input.teamId), eq(teams.ownerId, ctx.userId)),
        })) ?? null
      );
    }),

  /**
   * Get a team by its slug.
   */
  getBySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      return (
        (await ctx.db.query.teams.findFirst({
          where: and(eq(teams.slug, input.slug), eq(teams.ownerId, ctx.userId)),
        })) ?? null
      );
    }),

  /**
   * Create a new team.
   */
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(255) }))
    .mutation(async ({ ctx, input }) => {
      const [newTeam] = await ctx.db
        .insert(teams)
        .values({
          ownerId: ctx.userId,
          name: input.name,
          slug: generateUniqueSlug(input.name),
          isPersonal: false,
        })
        .returning();

      return newTeam;
    }),

  /**
   * Update a team's name.
   */
  update: protectedProcedure
    .input(
      z.object({
        teamId: z.string().uuid(),
        name: z.string().min(1).max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updatedTeam] = await ctx.db
        .update(teams)
        .set({ name: input.name })
        .where(and(eq(teams.id, input.teamId), eq(teams.ownerId, ctx.userId)))
        .returning();

      return updatedTeam ?? null;
    }),

  /**
   * Sync a Clerk organization to the local database.
   */
  syncFromClerk: protectedProcedure
    .input(
      z.object({
        clerkOrgId: z.string().min(1),
        name: z.string().min(1).max(255),
        slug: z.string().min(1).max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingTeam = await ctx.db.query.teams.findFirst({
        where: eq(teams.clerkOrgId, input.clerkOrgId),
      });

      if (existingTeam) {
        const [updatedTeam] = await ctx.db
          .update(teams)
          .set({ name: input.name, slug: input.slug })
          .where(eq(teams.clerkOrgId, input.clerkOrgId))
          .returning();

        return updatedTeam;
      }

      const slugExists = await ctx.db.query.teams.findFirst({
        where: eq(teams.slug, input.slug),
      });

      const [newTeam] = await ctx.db
        .insert(teams)
        .values({
          clerkOrgId: input.clerkOrgId,
          ownerId: ctx.userId,
          name: input.name,
          slug: slugExists ? generateUniqueSlug(input.slug) : input.slug,
          isPersonal: false,
        })
        .returning();

      return newTeam;
    }),

  /**
   * Delete a team (non-personal only).
   */
  delete: protectedProcedure
    .input(z.object({ teamId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const team = await ctx.db.query.teams.findFirst({
        where: and(eq(teams.id, input.teamId), eq(teams.ownerId, ctx.userId)),
      });

      if (!team) throw new Error("Team not found or access denied");
      if (team.isPersonal) throw new Error("Cannot delete personal team");

      await ctx.db.delete(teams).where(eq(teams.id, input.teamId));
      return { success: true };
    }),
});
