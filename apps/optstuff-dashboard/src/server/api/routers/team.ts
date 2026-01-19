import { eq, and, ne } from "drizzle-orm";
import { z } from "zod";
import { clerkClient } from "@workspace/auth/server";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { teams } from "@/server/db/schema";
import { generateSlug, generateUniqueSlug } from "@/lib/slug";
import {
  checkTeamAccess,
  checkTeamAccessBySlug,
  getUserTeams,
} from "@/server/lib/team-access";

export const teamRouter = createTRPCRouter({
  /**
   * Get or create the user's personal team.
   * Creates a Clerk organization with slug synced to local DB.
   */
  ensurePersonalTeam: protectedProcedure.mutation(async ({ ctx }) => {
    const { userId, db } = ctx;

    const existingTeam = await db.query.teams.findFirst({
      where: and(eq(teams.ownerId, userId), eq(teams.isPersonal, true)),
    });

    if (existingTeam) return existingTeam;

    const client = await clerkClient();

    // Get user info to create username-based slug
    const user = await client.users.getUser(userId);
    const username =
      user.username ?? user.emailAddresses[0]?.emailAddress?.split("@")[0];

    // Use username/email if available, otherwise use full ownerId (guaranteed unique)
    const personalSlug = username
      ? `${username.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-personal-team`
      : `${userId.replace("user_", "")}-personal-team`;

    // Create Clerk organization with slug
    const org = await client.organizations.createOrganization({
      name: "Personal Team",
      slug: personalSlug,
      createdBy: userId,
    });

    const [newTeam] = await db
      .insert(teams)
      .values({
        ownerId: userId,
        clerkOrgId: org.id,
        name: "Personal Team",
        slug: personalSlug,
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
   * List all teams the user has access to via Clerk memberships.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const userTeams = await getUserTeams(ctx.db, ctx.userId);

    // Sort: personal teams first, then by createdAt descending
    return userTeams.sort((a, b) => {
      if (a.isPersonal && !b.isPersonal) return -1;
      if (!a.isPersonal && b.isPersonal) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }),

  /**
   * Get a specific team by ID.
   * Verifies access via Clerk membership.
   */
  get: protectedProcedure
    .input(z.object({ teamId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { hasAccess, team } = await checkTeamAccess(
        ctx.db,
        input.teamId,
        ctx.userId,
      );

      if (!hasAccess) return null;
      return team;
    }),

  /**
   * Get a team by its slug.
   * Verifies access via Clerk membership.
   */
  getBySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const { hasAccess, team } = await checkTeamAccessBySlug(
        ctx.db,
        input.slug,
        ctx.userId,
      );

      if (!hasAccess) return null;
      return team;
    }),

  /**
   * Create a new team.
   * Creates a Clerk Organization first, then syncs to local database.
   */
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(255) }))
    .mutation(async ({ ctx, input }) => {
      // Generate a simple slug from the name
      const baseSlug = generateSlug(input.name);

      // Check if slug already exists locally
      const slugExists = await ctx.db.query.teams.findFirst({
        where: eq(teams.slug, baseSlug),
      });

      const finalSlug = slugExists ? generateUniqueSlug(input.name) : baseSlug;

      // Create Clerk organization with slug
      const client = await clerkClient();
      const org = await client.organizations.createOrganization({
        name: input.name,
        slug: finalSlug,
        createdBy: ctx.userId,
      });

      // Create local team record
      const [newTeam] = await ctx.db
        .insert(teams)
        .values({
          ownerId: ctx.userId,
          clerkOrgId: org.id,
          name: input.name,
          slug: finalSlug,
          isPersonal: false,
        })
        .returning();

      return newTeam;
    }),

  /**
   * Update a team's name.
   * Only org:admin can update.
   */
  update: protectedProcedure
    .input(
      z.object({
        teamId: z.string().uuid(),
        name: z.string().min(1).max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check access with admin role required
      const { hasAccess, team } = await checkTeamAccess(
        ctx.db,
        input.teamId,
        ctx.userId,
        ["org:admin"],
      );

      if (!hasAccess || !team) {
        throw new Error("Team not found or access denied");
      }

      // Update Clerk organization name if it has clerkOrgId
      if (team.clerkOrgId) {
        const client = await clerkClient();
        await client.organizations.updateOrganization(team.clerkOrgId, {
          name: input.name,
        });
      }

      // Update local team record
      const [updatedTeam] = await ctx.db
        .update(teams)
        .set({ name: input.name })
        .where(eq(teams.id, input.teamId))
        .returning();

      return updatedTeam ?? null;
    }),

  /**
   * Sync a Clerk organization to the local database.
   * Called when a new organization is detected via Clerk hooks.
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
        // Check if new slug conflicts with another team (excluding this one)
        const slugConflict = await ctx.db.query.teams.findFirst({
          where: and(
            eq(teams.slug, input.slug),
            ne(teams.clerkOrgId, input.clerkOrgId),
          ),
        });

        const finalSlug = slugConflict
          ? generateUniqueSlug(input.slug)
          : input.slug;

        const [updatedTeam] = await ctx.db
          .update(teams)
          .set({ name: input.name, slug: finalSlug })
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
   * Only org:admin can delete. Also deletes the Clerk organization.
   */
  delete: protectedProcedure
    .input(z.object({ teamId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Check access with admin role required
      const { hasAccess, team } = await checkTeamAccess(
        ctx.db,
        input.teamId,
        ctx.userId,
        ["org:admin"],
      );

      if (!hasAccess || !team) {
        throw new Error("Team not found or access denied");
      }

      if (team.isPersonal) {
        throw new Error("Cannot delete personal team");
      }

      // Delete Clerk organization if it exists
      if (team.clerkOrgId) {
        const client = await clerkClient();
        try {
          await client.organizations.deleteOrganization(team.clerkOrgId);
        } catch (error) {
          console.error("Failed to delete Clerk organization:", error);
          // Continue with local deletion even if Clerk deletion fails
        }
      }

      // Delete local team record
      await ctx.db.delete(teams).where(eq(teams.id, input.teamId));
      return { success: true };
    }),
});
