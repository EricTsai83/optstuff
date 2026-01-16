import { eq, and } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { teams } from "@/server/db/schema";

/**
 * Generates a URL-friendly slug from a name.
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const teamRouter = createTRPCRouter({
  /**
   * Get or create the user's personal team.
   * This is called on first login to ensure every user has a personal team.
   */
  ensurePersonalTeam: protectedProcedure.mutation(async ({ ctx }) => {
    const { userId, db } = ctx;

    // Check if personal team already exists
    const existingTeam = await db.query.teams.findFirst({
      where: and(eq(teams.ownerId, userId), eq(teams.isPersonal, true)),
    });

    if (existingTeam) {
      return existingTeam;
    }

    // Create new personal team
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

    const team = await db.query.teams.findFirst({
      where: and(eq(teams.ownerId, userId), eq(teams.isPersonal, true)),
    });

    return team ?? null;
  }),

  /**
   * List all teams the user has access to.
   * Includes personal team and any Clerk organizations they belong to.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const { userId, db } = ctx;

    // For now, return all teams owned by the user
    // In the future, this should also include teams where the user is a member
    // via Clerk Organizations
    const userTeams = await db.query.teams.findMany({
      where: eq(teams.ownerId, userId),
      orderBy: (teams, { desc }) => [
        desc(teams.isPersonal),
        desc(teams.createdAt),
      ],
    });

    return userTeams;
  }),

  /**
   * Get a specific team by ID.
   * Verifies user has access to the team.
   */
  get: protectedProcedure
    .input(z.object({ teamId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { userId, db } = ctx;

      const team = await db.query.teams.findFirst({
        where: and(eq(teams.id, input.teamId), eq(teams.ownerId, userId)),
      });

      return team ?? null;
    }),

  /**
   * Get a team by its slug.
   * Verifies user has access to the team.
   */
  getBySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const { userId, db } = ctx;

      const team = await db.query.teams.findFirst({
        where: and(eq(teams.slug, input.slug), eq(teams.ownerId, userId)),
      });

      return team ?? null;
    }),

  /**
   * Create a new team (non-personal, i.e., organization).
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, db } = ctx;

      const slug = generateSlug(input.name);
      const uniqueSlug = `${slug}-${Date.now().toString(36)}`;

      const [newTeam] = await db
        .insert(teams)
        .values({
          ownerId: userId,
          name: input.name,
          slug: uniqueSlug,
          isPersonal: false,
        })
        .returning();

      return newTeam;
    }),

  /**
   * Update a team's name.
   * Only the owner can update the team.
   */
  update: protectedProcedure
    .input(
      z.object({
        teamId: z.string().uuid(),
        name: z.string().min(1).max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, db } = ctx;

      const [updatedTeam] = await db
        .update(teams)
        .set({ name: input.name })
        .where(and(eq(teams.id, input.teamId), eq(teams.ownerId, userId)))
        .returning();

      return updatedTeam ?? null;
    }),

  /**
   * Sync a Clerk organization to the local database.
   * Called after creating an organization via Clerk's CreateOrganization component.
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
      const { userId, db } = ctx;

      // Check if this Clerk org is already synced
      const existingTeam = await db.query.teams.findFirst({
        where: eq(teams.clerkOrgId, input.clerkOrgId),
      });

      if (existingTeam) {
        // Update existing team if name or slug changed
        const [updatedTeam] = await db
          .update(teams)
          .set({
            name: input.name,
            slug: input.slug,
          })
          .where(eq(teams.clerkOrgId, input.clerkOrgId))
          .returning();

        return updatedTeam;
      }

      // Check if slug already exists (might conflict with another team)
      const slugExists = await db.query.teams.findFirst({
        where: eq(teams.slug, input.slug),
      });

      const finalSlug = slugExists
        ? `${input.slug}-${Date.now().toString(36)}`
        : input.slug;

      // Create new team linked to Clerk org
      const [newTeam] = await db
        .insert(teams)
        .values({
          clerkOrgId: input.clerkOrgId,
          ownerId: userId,
          name: input.name,
          slug: finalSlug,
          isPersonal: false,
        })
        .returning();

      return newTeam;
    }),

  /**
   * Delete a team (organization).
   * Only non-personal teams can be deleted.
   */
  delete: protectedProcedure
    .input(z.object({ teamId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { userId, db } = ctx;

      const team = await db.query.teams.findFirst({
        where: and(eq(teams.id, input.teamId), eq(teams.ownerId, userId)),
      });

      if (!team) {
        throw new Error("Team not found or access denied");
      }

      if (team.isPersonal) {
        throw new Error("Cannot delete personal team");
      }

      await db.delete(teams).where(eq(teams.id, input.teamId));

      return { success: true };
    }),
});
