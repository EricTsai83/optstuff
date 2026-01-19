import { eq, and, inArray } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { clerkClient, auth } from "@workspace/auth/server";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { teams } from "@/server/db/schema";
import { generateSlug } from "@/lib/slug";
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
   * Note: This requires Clerk API call as we need ALL teams, not just active one.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const client = await clerkClient();

    // Get all organization memberships for the user from Clerk
    const memberships = await client.users.getOrganizationMembershipList({
      userId: ctx.userId,
    });

    if (!memberships.data || memberships.data.length === 0) {
      return [];
    }

    // Extract org IDs and create a map of orgId -> role
    const orgRoleMap = new Map<string, string>();
    for (const membership of memberships.data) {
      orgRoleMap.set(membership.organization.id, membership.role);
    }

    const orgIds = Array.from(orgRoleMap.keys());

    // Query local teams that match these Clerk org IDs
    const userTeams = await ctx.db.query.teams.findMany({
      where: inArray(teams.clerkOrgId, orgIds),
    });

    // Add role to each team and sort
    const teamsWithRole = userTeams.map((team) => ({
      ...team,
      role: orgRoleMap.get(team.clerkOrgId) ?? "org:member",
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
   * Uses session's orgId to verify access (no Clerk API call).
   */
  get: protectedProcedure
    .input(z.object({ teamId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { orgId } = await auth();

      const team = await ctx.db.query.teams.findFirst({
        where: eq(teams.id, input.teamId),
      });

      // Verify the team belongs to user's active organization
      if (!team || team.clerkOrgId !== orgId) {
        return null;
      }

      return team;
    }),

  /**
   * Get a team by its slug.
   * Uses session's orgSlug to verify access (no Clerk API call).
   */
  getBySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const { orgSlug, orgId } = await auth();

      // Quick check: if slug doesn't match active org, deny access
      if (orgSlug !== input.slug) {
        return null;
      }

      const team = await ctx.db.query.teams.findFirst({
        where: eq(teams.slug, input.slug),
      });

      // Double-check orgId matches for security
      if (!team || team.clerkOrgId !== orgId) {
        return null;
      }

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
   * Only org:admin can update. Uses has() to check role.
   */
  update: protectedProcedure
    .input(
      z.object({
        teamId: z.string().uuid(),
        name: z.string().min(1).max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { has, orgId } = await auth();

      // Use has() to check admin role (reads from session token, no API call)
      if (!has({ role: "org:admin" })) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin role required",
        });
      }

      // Verify team belongs to user's active organization
      const team = await ctx.db.query.teams.findFirst({
        where: eq(teams.id, input.teamId),
      });

      if (!team || team.clerkOrgId !== orgId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" });
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
      // Verify user has membership in the provided Clerk organization
      const client = await clerkClient();
      const memberships = await client.users.getOrganizationMembershipList({
        userId: ctx.userId,
      });

      const hasAccess = memberships.data.some(
        (membership) => membership.organization.id === input.clerkOrgId,
      );

      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this organization",
        });
      }

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
   * Only org:admin can delete. Uses has() to check role.
   */
  delete: protectedProcedure
    .input(z.object({ teamId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { has, orgId } = await auth();

      // Use has() to check admin role (reads from session token, no API call)
      if (!has({ role: "org:admin" })) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin role required",
        });
      }

      // Verify team belongs to user's active organization
      const team = await ctx.db.query.teams.findFirst({
        where: eq(teams.id, input.teamId),
      });

      if (!team || team.clerkOrgId !== orgId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" });
      }

      if (team.isPersonal) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete personal team",
        });
      }

      // Delete from Clerk first (source of truth)
      const client = await clerkClient();
      await client.organizations.deleteOrganization(team.clerkOrgId);

      // Only delete local record after Clerk deletion succeeds
      await ctx.db.delete(teams).where(eq(teams.id, input.teamId));
      return { success: true };
    }),
});
