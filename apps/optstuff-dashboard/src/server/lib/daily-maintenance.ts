import { and, count, eq, inArray, isNull, lt, lte } from "drizzle-orm";

import { db } from "@/server/db";
import { apiKeys, maintenanceRetryTasks, projects } from "@/server/db/schema";
import { invalidateApiKeyCache } from "@/server/lib/config-cache";
import { cleanupOldRequestLogs } from "@/server/lib/request-logger";

const RETRY_BATCH_LIMIT = 200;
const RETRY_BASE_DELAY_MS = 60_000;
const RETRY_MAX_DELAY_MS = 6 * 60 * 60 * 1000;
const RETRY_TASK_SYNC_PROJECT_API_KEY_COUNT = "sync_project_api_key_count";
const RETRY_TASK_INVALIDATE_API_KEY_CACHE = "invalidate_api_key_cache";

type MaintenanceRetryTaskType =
  | typeof RETRY_TASK_SYNC_PROJECT_API_KEY_COUNT
  | typeof RETRY_TASK_INVALIDATE_API_KEY_CACHE;

function formatUnknownError(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

function computeRetryBackoffMs(attempts: number): number {
  const exponent = Math.max(0, attempts - 1);
  return Math.min(RETRY_MAX_DELAY_MS, RETRY_BASE_DELAY_MS * 2 ** exponent);
}

async function enqueueMaintenanceRetryTask(
  taskType: MaintenanceRetryTaskType,
  taskKey: string,
  error: unknown,
): Promise<void> {
  const now = new Date();
  const errorMessage = formatUnknownError(error);

  await db
    .insert(maintenanceRetryTasks)
    .values({
      taskType,
      taskKey,
      attempts: 0,
      nextRunAt: now,
      lastError: errorMessage,
    })
    .onConflictDoUpdate({
      target: [maintenanceRetryTasks.taskType, maintenanceRetryTasks.taskKey],
      set: {
        attempts: 0,
        nextRunAt: now,
        lastError: errorMessage,
        updatedAt: now,
      },
    });
}

async function executeMaintenanceRetryTask(task: {
  taskType: string;
  taskKey: string;
}): Promise<void> {
  if (task.taskType === RETRY_TASK_SYNC_PROJECT_API_KEY_COUNT) {
    await syncProjectApiKeyCount(task.taskKey);
    return;
  }

  if (task.taskType === RETRY_TASK_INVALIDATE_API_KEY_CACHE) {
    await invalidateApiKeyCache(task.taskKey);
    return;
  }

  throw new Error(`Unknown maintenance retry task type: ${task.taskType}`);
}

async function processMaintenanceRetryTasks(now = new Date()): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  exhausted: number;
  remaining: number;
}> {
  const dueTasks = await db
    .select({
      id: maintenanceRetryTasks.id,
      taskType: maintenanceRetryTasks.taskType,
      taskKey: maintenanceRetryTasks.taskKey,
      attempts: maintenanceRetryTasks.attempts,
      maxAttempts: maintenanceRetryTasks.maxAttempts,
    })
    .from(maintenanceRetryTasks)
    .where(
      and(
        lte(maintenanceRetryTasks.nextRunAt, now),
        lt(maintenanceRetryTasks.attempts, maintenanceRetryTasks.maxAttempts),
      ),
    )
    .orderBy(maintenanceRetryTasks.nextRunAt)
    .limit(RETRY_BATCH_LIMIT);

  let succeeded = 0;
  let failed = 0;
  let exhausted = 0;

  for (const task of dueTasks) {
    try {
      await executeMaintenanceRetryTask({
        taskType: task.taskType,
        taskKey: task.taskKey,
      });
      succeeded += 1;

      await db.delete(maintenanceRetryTasks).where(eq(maintenanceRetryTasks.id, task.id));
    } catch (error) {
      failed += 1;
      const nextAttempts = task.attempts + 1;
      const hasExhausted = nextAttempts >= task.maxAttempts;
      const errorMessage = formatUnknownError(error);

      await db
        .update(maintenanceRetryTasks)
        .set({
          attempts: nextAttempts,
          nextRunAt: hasExhausted
            ? now
            : new Date(now.getTime() + computeRetryBackoffMs(nextAttempts)),
          lastError: errorMessage,
        })
        .where(eq(maintenanceRetryTasks.id, task.id));

      if (hasExhausted) exhausted += 1;

      console.error(
        `[DailyMaintenance] Retry task failed (${task.taskType}:${task.taskKey}) attempt ${nextAttempts}/${task.maxAttempts}:`,
        error,
      );
    }
  }

  const [remainingDue] = await db
    .select({ count: count() })
    .from(maintenanceRetryTasks)
    .where(
      and(
        lte(maintenanceRetryTasks.nextRunAt, now),
        lt(maintenanceRetryTasks.attempts, maintenanceRetryTasks.maxAttempts),
      ),
    );

  return {
    processed: dueTasks.length,
    succeeded,
    failed,
    exhausted,
    remaining: remainingDue?.count ?? 0,
  };
}

/**
 * Recomputes and persists the active API key count for a project.
 *
 * @param projectId - Target project id.
 * @returns A promise that resolves once the project counter is updated.
 */
async function syncProjectApiKeyCount(projectId: string): Promise<void> {
  const [result] = await db
    .select({ count: count() })
    .from(apiKeys)
    .where(and(eq(apiKeys.projectId, projectId), isNull(apiKeys.revokedAt)));

  await db
    .update(projects)
    .set({ apiKeyCount: result?.count ?? 0 })
    .where(eq(projects.id, projectId));
}

/**
 * Revokes all API keys that are expired at the provided timestamp.
 *
 * This function performs a bulk revoke, updates denormalized project counters,
 * and then triggers best-effort cache invalidation for affected keys.
 *
 * @param now - Cutoff timestamp used to determine whether a key is expired.
 * @returns Number of expired keys revoked and number of affected projects.
 */
export async function revokeExpiredApiKeys(now = new Date()): Promise<{
  expiredKeys: number;
  affectedProjects: number;
  queuedRetryTasks: number;
}> {
  const expired = await db.query.apiKeys.findMany({
    where: and(isNull(apiKeys.revokedAt), lte(apiKeys.expiresAt, now)),
    columns: {
      id: true,
      publicKey: true,
      projectId: true,
    },
  });

  if (expired.length === 0) {
    return { expiredKeys: 0, affectedProjects: 0, queuedRetryTasks: 0 };
  }

  const expiredIds = expired.map((key) => key.id);
  const affectedProjectIds = [...new Set(expired.map((key) => key.projectId))];

  await db
    .update(apiKeys)
    .set({ revokedAt: now })
    .where(inArray(apiKeys.id, expiredIds));

  const syncResults = await Promise.allSettled(
    affectedProjectIds.map((projectId) => syncProjectApiKeyCount(projectId)),
  );
  let queuedRetryTasks = 0;
  for (const [index, result] of syncResults.entries()) {
    if (result.status === "rejected") {
      const projectId = affectedProjectIds[index];
      if (!projectId) continue;
      console.error(
        `[DailyMaintenance] Failed to sync API key count for project ${projectId}:`,
        result.reason,
      );
      try {
        await enqueueMaintenanceRetryTask(
          RETRY_TASK_SYNC_PROJECT_API_KEY_COUNT,
          projectId,
          result.reason,
        );
        queuedRetryTasks += 1;
      } catch (err) {
        console.warn(
          "[DailyMaintenance] Failed to enqueue retry task for API key count sync",
          { err, projectId },
        );
      }
    }
  }

  const cacheInvalidationResults = await Promise.allSettled(
    expired.map((key) => invalidateApiKeyCache(key.publicKey)),
  );
  for (const [index, result] of cacheInvalidationResults.entries()) {
    if (result.status === "rejected") {
      const expiredKey = expired[index];
      const publicKey = expiredKey?.publicKey;
      const projectId = expiredKey?.projectId;
      console.error(
        `[DailyMaintenance] Failed to invalidate API key cache for public key ${publicKey}:`,
        result.reason,
      );

      if (publicKey) {
        try {
          await enqueueMaintenanceRetryTask(
            RETRY_TASK_INVALIDATE_API_KEY_CACHE,
            publicKey,
            result.reason,
          );
          queuedRetryTasks += 1;
        } catch (err) {
          console.warn(
            "[DailyMaintenance] Failed to enqueue retry task for API key cache invalidation",
            { err, projectId },
          );
        }
      }
    }
  }

  return {
    expiredKeys: expired.length,
    affectedProjects: affectedProjectIds.length,
    queuedRetryTasks,
  };
}

/**
 * Executes all daily maintenance jobs and returns a consolidated result.
 *
 * Retry tasks are processed first. Then the cleanup and key-sweep jobs run
 * concurrently. A failure in one job does not prevent the other job from
 * completing, and each job status is reported independently.
 *
 * @returns Overall success flag, duration, and per-job outcomes.
 */
export async function runDailyMaintenance(): Promise<{
  ok: boolean;
  durationMs: number;
  retryQueue: {
    ok: boolean;
    processed?: number;
    succeeded?: number;
    failed?: number;
    exhausted?: number;
    remaining?: number;
    error?: string;
  };
  requestLogCleanup: { ok: boolean; deletedCount?: number; error?: string };
  expiredApiKeySweep: {
    ok: boolean;
    expiredKeys?: number;
    affectedProjects?: number;
    queuedRetryTasks?: number;
    error?: string;
  };
}> {
  const startedAt = Date.now();
  let retryQueue:
    | {
        ok: true;
        processed: number;
        succeeded: number;
        failed: number;
        exhausted: number;
        remaining: number;
      }
    | { ok: false; error: string };

  try {
    const retryResult = await processMaintenanceRetryTasks();
    retryQueue = {
      ok: true,
      processed: retryResult.processed,
      succeeded: retryResult.succeeded,
      failed: retryResult.failed,
      exhausted: retryResult.exhausted,
      remaining: retryResult.remaining,
    };
  } catch (error) {
    retryQueue = { ok: false, error: String(error) };
  }

  const [cleanupResult, sweepResult] = await Promise.allSettled([
    cleanupOldRequestLogs(),
    revokeExpiredApiKeys(),
  ]);

  const requestLogCleanup =
    cleanupResult.status === "fulfilled"
      ? { ok: true, deletedCount: cleanupResult.value }
      : { ok: false, error: String(cleanupResult.reason) };

  const expiredApiKeySweep =
    sweepResult.status === "fulfilled"
      ? {
          ok: true,
          expiredKeys: sweepResult.value.expiredKeys,
          affectedProjects: sweepResult.value.affectedProjects,
          queuedRetryTasks: sweepResult.value.queuedRetryTasks,
        }
      : { ok: false, error: String(sweepResult.reason) };

  return {
    ok: retryQueue.ok && requestLogCleanup.ok && expiredApiKeySweep.ok,
    durationMs: Date.now() - startedAt,
    retryQueue,
    requestLogCleanup,
    expiredApiKeySweep,
  };
}
