import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { teams } from "@/server/db/schema";

/**
 * Generate a short random suffix for slug collision handling.
 */
function generateRandomSuffix(length = 4): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const MAX_SLUG_RETRIES = 5;

/**
 * Shared Zod schema for team slug validation.
 * Reused across create, createPersonalTeam, and checkSlugAvailable procedures.
 */
const slugSchema = z
  .string()
  .min(3)
  .max(50)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must be lowercase letters, numbers, and hyphens only",
  );

export const teamRouter = createTRPCRouter({
  /**
   * Get or create the user's personal team.
   * Guarantees returning a team or throwing an error - never returns null.
   */
  ensurePersonalTeam: protectedProcedure.mutation(async ({ ctx }) => {
    const { userId, db } = ctx;

    // Check if user already has a personal team
    const existingTeam = await db.query.teams.findFirst({
      where: and(eq(teams.ownerId, userId), eq(teams.isPersonal, true)),
    });

    if (existingTeam) return existingTeam;

    // Try to create personal team with retry logic for slug collisions
    const baseSlug = `${userId.replace("user_", "")}-personal`;

    for (let attempt = 0; attempt < MAX_SLUG_RETRIES; attempt++) {
      const personalSlug =
        attempt === 0 ? baseSlug : `${baseSlug}-${generateRandomSuffix()}`;

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

      // Check if another request already created the personal team for this user
      // (conflict might be on ownerId+isPersonal constraint, not just slug)
      const concurrentlyCreatedTeam = await db.query.teams.findFirst({
        where: and(eq(teams.ownerId, userId), eq(teams.isPersonal, true)),
      });

      if (concurrentlyCreatedTeam) return concurrentlyCreatedTeam;

      // Slug collision with another user's team, retry with new suffix
    }

    // Final fallback: query for existing personal team one more time
    const fallbackTeam = await db.query.teams.findFirst({
      where: and(eq(teams.ownerId, userId), eq(teams.isPersonal, true)),
    });

    if (fallbackTeam) return fallbackTeam;

    // If we still can't create or find a personal team, throw an error
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message:
        "Failed to create personal team after multiple attempts. Please try again.",
    });
  }),

  /**
   * Create the user's personal team with a custom slug.
   * Used during onboarding when user chooses their slug.
   */
  createPersonalTeam: protectedProcedure
    .input(
      z.object({
        slug: slugSchema,
        name: z.string().min(1).max(255).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, db } = ctx;

      // Check if user already has a personal team
      const existingPersonalTeam = await db.query.teams.findFirst({
        where: and(eq(teams.ownerId, userId), eq(teams.isPersonal, true)),
      });

      if (existingPersonalTeam) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You already have a personal team.",
        });
      }

      // Create personal team with custom slug using onConflictDoNothing to handle race conditions
      const [newTeam] = await db
        .insert(teams)
        .values({
          ownerId: userId,
          name: input.name ?? "Personal Team",
          slug: input.slug,
          isPersonal: true,
        })
        .onConflictDoNothing()
        .returning();

      if (!newTeam) {
        // Check if conflict was due to ownerId+isPersonal constraint (race condition)
        // or due to slug collision
        const concurrentlyCreatedTeam = await db.query.teams.findFirst({
          where: and(eq(teams.ownerId, userId), eq(teams.isPersonal, true)),
        });

        if (concurrentlyCreatedTeam) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You already have a personal team.",
          });
        }

        // Slug collision with another team
        throw new TRPCError({
          code: "CONFLICT",
          message: "This slug is already taken. Please choose a different one.",
        });
      }

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
        slug: slugSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Create local team record using onConflictDoNothing to handle race conditions
      const [newTeam] = await ctx.db
        .insert(teams)
        .values({
          ownerId: ctx.userId,
          name: input.name,
          slug: input.slug,
          isPersonal: false,
        })
        .onConflictDoNothing()
        .returning();

      if (!newTeam) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This slug is already taken. Please choose a different one.",
        });
      }

      return newTeam;
    }),

  /**
   * Check if a slug is available.
   */
  checkSlugAvailable: protectedProcedure
    .input(z.object({ slug: slugSchema }))
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
