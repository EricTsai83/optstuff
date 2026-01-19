import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { clerkClient } from "@workspace/auth/server";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { teams } from "@/server/db/schema";
import { generateSlug } from "@/lib/slug";
import {
  checkTeamAccess,
  checkTeamAccessBySlug,
  getUserTeams,
} from "@/server/lib/team-access";
import { syncUserTeams } from "@/server/lib/team-sync";

export const teamRouter = createTRPCRouter({
  /**
   * Get or create the user's personal team.
   * Clerk is the source of truth - check Clerk first, then sync to local DB.
   */
  ensurePersonalTeam: protectedProcedure.mutation(async ({ ctx }) => {
    const { userId, db } = ctx;

    // Check local DB first
    const existingTeam = await db.query.teams.findFirst({
      where: and(eq(teams.ownerId, userId), eq(teams.isPersonal, true)),
    });

    if (existingTeam) return existingTeam;

    // Sync from Clerk or create personal team
    return syncUserTeams(db, userId);
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
   * Creates a Clerk Organization first (source of truth), then syncs to local database.
   */
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(255) }))
    .mutation(async ({ ctx, input }) => {
      // Generate a simple slug from the name
      const slug = generateSlug(input.name);

      // Create Clerk organization first (Clerk is source of truth)
      const client = await clerkClient();
      const org = await client.organizations.createOrganization({
        name: input.name,
        slug,
        createdBy: ctx.userId,
      });

      // Create local team record using Clerk's slug
      const [newTeam] = await ctx.db
        .insert(teams)
        .values({
          ownerId: ctx.userId,
          clerkOrgId: org.id,
          name: input.name,
          slug: org.slug!,
          isPersonal: false,
        })
        .returning();

      return newTeam;
    }),

  /**
   * Update a team's name.
   * Only org:admin can update. Clerk is source of truth.
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

      // Update Clerk organization first (source of truth)
      const client = await clerkClient();
      const updatedOrg = await client.organizations.updateOrganization(
        team.clerkOrgId,
        { name: input.name },
      );

      // Sync to local DB using Clerk's data
      const [updatedTeam] = await ctx.db
        .update(teams)
        .set({ name: updatedOrg.name })
        .where(eq(teams.id, input.teamId))
        .returning();

      return updatedTeam ?? null;
    }),

  /**
   * Sync a Clerk organization to the local database.
   * Called when a new organization is detected via Clerk UI components.
   * Clerk is the source of truth - local slug must match Clerk's slug.
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
      // Check if team already exists by clerkOrgId
      const existingTeam = await ctx.db.query.teams.findFirst({
        where: eq(teams.clerkOrgId, input.clerkOrgId),
      });

      if (existingTeam) {
        // Update existing team to match Clerk's data
        const [updatedTeam] = await ctx.db
          .update(teams)
          .set({ name: input.name, slug: input.slug })
          .where(eq(teams.clerkOrgId, input.clerkOrgId))
          .returning();

        return updatedTeam;
      }

      // Check if a team with this slug already exists (orphaned record)
      const orphanedTeam = await ctx.db.query.teams.findFirst({
        where: eq(teams.slug, input.slug),
      });

      if (orphanedTeam) {
        // Update orphaned team to link with this Clerk org
        const [updatedTeam] = await ctx.db
          .update(teams)
          .set({
            clerkOrgId: input.clerkOrgId,
            name: input.name,
          })
          .where(eq(teams.id, orphanedTeam.id))
          .returning();

        return updatedTeam;
      }

      // Create new team record
      const [newTeam] = await ctx.db
        .insert(teams)
        .values({
          clerkOrgId: input.clerkOrgId,
          ownerId: ctx.userId,
          name: input.name,
          slug: input.slug,
          isPersonal: false,
        })
        .returning();

      return newTeam;
    }),

  /**
   * Delete a team (non-personal only).
   * Only org:admin can delete. Clerk is source of truth - delete from Clerk first.
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

      // Delete from Clerk first (source of truth)
      const client = await clerkClient();
      await client.organizations.deleteOrganization(team.clerkOrgId);

      // Only delete local record after Clerk deletion succeeds
      await ctx.db.delete(teams).where(eq(teams.id, input.teamId));
      return { success: true };
    }),
});
