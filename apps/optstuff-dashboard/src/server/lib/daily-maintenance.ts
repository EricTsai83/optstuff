import { and, count, eq, inArray, isNull, lte } from "drizzle-orm";

import { db } from "@/server/db";
import { apiKeys, projects } from "@/server/db/schema";
import { invalidateApiKeyCache } from "@/server/lib/config-cache";
import { cleanupOldRequestLogs } from "@/server/lib/request-logger";

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
    return { expiredKeys: 0, affectedProjects: 0 };
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
  for (const [index, result] of syncResults.entries()) {
    if (result.status === "rejected") {
      console.error(
        `[DailyMaintenance] Failed to sync API key count for project ${affectedProjectIds[index]}:`,
        result.reason,
      );
    }
  }

  await Promise.allSettled(
    expired.map((key) => invalidateApiKeyCache(key.publicKey)),
  );

  return {
    expiredKeys: expired.length,
    affectedProjects: affectedProjectIds.length,
  };
}

/**
 * Executes all daily maintenance jobs and returns a consolidated result.
 *
 * Jobs run concurrently. A failure in one job does not prevent the other job
 * from completing, and each job status is reported independently.
 *
 * @returns Overall success flag, duration, and per-job outcomes.
 */
export async function runDailyMaintenance(): Promise<{
  ok: boolean;
  durationMs: number;
  requestLogCleanup: { ok: boolean; deletedCount?: number; error?: string };
  expiredApiKeySweep: {
    ok: boolean;
    expiredKeys?: number;
    affectedProjects?: number;
    error?: string;
  };
}> {
  const startedAt = Date.now();

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
        }
      : { ok: false, error: String(sweepResult.reason) };

  return {
    ok: requestLogCleanup.ok && expiredApiKeySweep.ok,
    durationMs: Date.now() - startedAt,
    requestLogCleanup,
    expiredApiKeySweep,
  };
}
