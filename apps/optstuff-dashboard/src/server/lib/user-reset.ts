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
import { nextResetAt, protectedResetUsers } from "./reset-policy";

const BATCH_SIZE = 50;
export const RESET_DEMO_USER = "reset_demo_user";

/** First authenticated use starts a cycle; later visits never extend it. */
export const recordResetCycle = cache(async (userId: string) => {
  const protectedUsers = protectedResetUsers(env.DEMO_RESET_PROTECTED_USER_IDS);
  if (
    env.DEMO_RESET_ENABLED !== "true" ||
    !protectedUsers ||
    protectedUsers.includes(userId)
  )
    return;
  const existing = await db.query.userResetCycles.findFirst({
    where: eq(userResetCycles.userId, userId),
    columns: { userId: true },
  });
  if (existing) return;
  const [history] = await db
    .select({ firstTeamAt: min(teams.createdAt) })
    .from(teams)
    .where(eq(teams.ownerId, userId));
  await db
    .insert(userResetCycles)
    .values({
      userId,
      nextResetAt: nextResetAt(history?.firstTeamAt ?? new Date()),
    })
    .onConflictDoNothing();
});

export async function resetDemoUsers(now = new Date()) {
  const protectedUsers = protectedResetUsers(env.DEMO_RESET_PROTECTED_USER_IDS);
  if (env.DEMO_RESET_ENABLED !== "true" || !protectedUsers) {
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
  const protectedUsers = protectedResetUsers(env.DEMO_RESET_PROTECTED_USER_IDS);
  if (
    env.DEMO_RESET_ENABLED !== "true" ||
    !protectedUsers ||
    protectedUsers.includes(userId)
  )
    return false;
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
    await tx
      .update(userResetCycles)
      .set({
        lastResetAt: now,
        nextResetAt: nextResetAt(now),
      })
      .where(eq(userResetCycles.userId, userId));
    return true;
  });
}
