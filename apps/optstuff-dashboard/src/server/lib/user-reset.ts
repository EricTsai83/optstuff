import { and, eq, inArray, lte, min, notInArray, sql } from "drizzle-orm";
import { cache } from "react";

import { env } from "@/env";
import { db } from "@/server/db";
import {
  maintenanceRetryTasks,
  pinnedProjects,
  projects,
  teams,
  userResetCycles,
} from "@/server/db/schema";
import { queueDeletedProjectCleanup } from "./deleted-project-cleanup";
import {
  demoResetProtectedUsers,
  nextResetAt,
  resetCycleAction,
  type ResetCycle,
} from "./reset-policy";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

const BATCH_SIZE = 50;
export const RESET_DEMO_USER = "reset_demo_user";

/** Shared opt-in gate for both destructive work and its user-facing notice. */
export function getDemoResetProtectedUsers(): string[] | null {
  return demoResetProtectedUsers(
    env.DEMO_RESET_ENABLED,
    env.DEMO_RESET_PROTECTED_USER_IDS,
  );
}

/** A returning user receives a fresh cycle after any expired data is removed. */
export const recordResetCycle = cache(
  async (userId: string): Promise<ResetCycle | null> => {
    const protectedUsers = getDemoResetProtectedUsers();
    if (!protectedUsers || protectedUsers.includes(userId)) return null;

    const now = new Date();
    const existing = await db.query.userResetCycles.findFirst({
      where: eq(userResetCycles.userId, userId),
    });
    if (existing && resetCycleAction(existing, now) === "continue")
      return existing;

    return db.transaction(async (tx) => {
      if (!existing) {
        const [history] = await tx
          .select({ firstTeamAt: min(teams.createdAt) })
          .from(teams)
          .where(eq(teams.ownerId, userId));
        await tx
          .insert(userResetCycles)
          .values({
            userId,
            nextResetAt: nextResetAt(history?.firstTeamAt ?? now),
          })
          .onConflictDoNothing();
      }
      // Cron and concurrent visits must recheck the cycle under the same row lock.
      const [cycle] = await tx
        .select()
        .from(userResetCycles)
        .where(eq(userResetCycles.userId, userId))
        .for("update");
      if (!cycle) throw new Error("Missing demo reset cycle");
      const action = resetCycleAction(cycle, now);
      if (action === "continue") return cycle;
      if (action === "reset") await deleteUserWorkspace(tx, userId);
      const resumed = {
        nextResetAt: nextResetAt(now),
        lastResetAt: action === "reset" ? now : cycle.lastResetAt,
      };
      await tx
        .update(userResetCycles)
        .set(resumed)
        .where(eq(userResetCycles.userId, userId));
      return resumed;
    });
  },
);

export async function resetDemoUsers(now = new Date()) {
  const protectedUsers = getDemoResetProtectedUsers();
  if (!protectedUsers) {
    return {
      ok: true,
      disabled: true,
      resetUsers: 0,
      failedUsers: 0,
      remaining: 0,
    };
  }

  // Existing accounts predate cycle tracking. Use their oldest team as the baseline.
  await db
    .insert(userResetCycles)
    .select(
      db
        .select({
          userId: teams.ownerId,
          nextResetAt:
            sql<Date>`min(${teams.createdAt}) + interval '14 days'`.as(
              "next_reset_at",
            ),
          lastResetAt: sql<Date | null>`null`.as("last_reset_at"),
        })
        .from(teams)
        .where(notInArray(teams.ownerId, protectedUsers))
        .groupBy(teams.ownerId),
    )
    .onConflictDoNothing();

  const dueCondition = and(
    lte(userResetCycles.nextResetAt, now),
    notInArray(userResetCycles.userId, protectedUsers),
  );
  // Persist all due work before deletion, so timeouts can resume via daily maintenance.
  const queued = await db
    .insert(maintenanceRetryTasks)
    .select(
      db
        .select({
          id: sql<string>`gen_random_uuid()`.as("id"),
          taskType: sql<string>`${RESET_DEMO_USER}`.as("task_type"),
          taskKey: userResetCycles.userId,
          attempts: sql<number>`0`.as("attempts"),
          maxAttempts: sql<number>`5`.as("max_attempts"),
          nextRunAt: sql<Date>`now()`.as("next_run_at"),
          lastError: sql<string | null>`null`.as("last_error"),
          createdAt: sql<Date>`now()`.as("created_at"),
          updatedAt: sql<Date>`now()`.as("updated_at"),
        })
        .from(userResetCycles)
        .where(dueCondition),
    )
    .onConflictDoNothing()
    .returning({ id: maintenanceRetryTasks.id });
  const due = await db
    .select({ userId: userResetCycles.userId })
    .from(userResetCycles)
    .where(dueCondition)
    .orderBy(userResetCycles.nextResetAt)
    .limit(BATCH_SIZE);
  let resetUsers = 0;
  let failedUsers = 0;
  for (const { userId } of due) {
    try {
      const didReset = await resetUserData(userId, now);
      if (didReset) resetUsers += 1;
    } catch (error) {
      failedUsers += 1;
      console.error("[DemoReset] Failed to reset user", { userId, error });
    }
  }
  const [remaining] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userResetCycles)
    .where(dueCondition);
  return {
    ok: failedUsers === 0,
    queuedUsers: queued.length,
    disabled: false,
    resetUsers,
    failedUsers,
    remaining: remaining?.count ?? 0,
  };
}

/** Also used by the durable maintenance queue to resume partial weekly runs. */
export async function resetUserData(
  userId: string,
  now = new Date(),
): Promise<boolean> {
  const protectedUsers = getDemoResetProtectedUsers();
  if (!protectedUsers || protectedUsers.includes(userId)) return false;
  return db.transaction(async (tx) => {
    // Serializes duplicate invocations. A committed cycle is never reset twice.
    const [cycle] = await tx
      .select()
      .from(userResetCycles)
      .where(
        and(
          eq(userResetCycles.userId, userId),
          lte(userResetCycles.nextResetAt, now),
        ),
      )
      .for("update");
    if (!cycle) return false;
    await deleteUserWorkspace(tx, userId);
    await tx
      .update(userResetCycles)
      .set({
        lastResetAt: now,
        nextResetAt: null,
      })
      .where(eq(userResetCycles.userId, userId));
    return true;
  });
}

/** Shared transaction boundary keeps login-time and scheduled resets identical. */
async function deleteUserWorkspace(
  tx: Transaction,
  userId: string,
): Promise<void> {
  const ownedTeams = await tx
    .select({ id: teams.id })
    .from(teams)
    .where(eq(teams.ownerId, userId))
    .for("update");
  const teamIds = ownedTeams.map((team) => team.id);
  if (teamIds.length > 0) {
    // Lock parents before collecting keys, preventing new child inserts
    // from escaping the durable cleanup snapshot.
    const deletedProjects = await tx
      .select({ id: projects.id, slug: projects.slug })
      .from(projects)
      .where(inArray(projects.teamId, teamIds))
      .for("update");
    await queueDeletedProjectCleanup(tx, deletedProjects);
    await tx.delete(teams).where(inArray(teams.id, teamIds));
  }
  await tx.delete(pinnedProjects).where(eq(pinnedProjects.userId, userId));
}
