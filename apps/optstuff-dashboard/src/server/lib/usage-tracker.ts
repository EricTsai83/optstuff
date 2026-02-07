/**
 * API Key usage tracking utilities.
 *
 * Uses Redis SET NX to throttle database writes — at most one DB update
 * per API key / project every {@link THROTTLE_SECONDS} seconds.
 * This avoids the in-memory batching approach which is unreliable in
 * serverless environments (setTimeout / Map state lost on container recycle).
 */

import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { apiKeys, projects } from "@/server/db/schema";
import { getRedis } from "@/server/lib/redis";

/**
 * Minimum interval (in seconds) between DB writes for the same key.
 * Redis SET NX with EX ensures only one write passes through per interval,
 * even across multiple serverless instances.
 */
const THROTTLE_SECONDS = 30;

/**
 * Update the lastUsedAt timestamp for an API key and lastActivityAt for the project.
 *
 * Uses Redis SET NX to ensure at most one DB write per {@link THROTTLE_SECONDS} seconds
 * per API key / project, reducing database load while working correctly in serverless.
 *
 * Fire-and-forget — errors are logged but never thrown.
 *
 * @param apiKeyId - The API key ID
 * @param projectId - The project ID
 */
export function updateApiKeyLastUsed(
  apiKeyId: string,
  projectId: string,
): void {
  const redis = getRedis();
  const now = new Date();

  // Throttle API key lastUsedAt updates
  redis
    .set(`usage:apikey:${apiKeyId}`, "1", { nx: true, ex: THROTTLE_SECONDS })
    .then((result) => {
      if (result === "OK") {
        return db
          .update(apiKeys)
          .set({ lastUsedAt: now })
          .where(eq(apiKeys.id, apiKeyId));
      }
    })
    .catch((error: unknown) => {
      console.error(
        `Failed to update lastUsedAt for API key ${apiKeyId}:`,
        error,
      );
    });

  // Throttle project lastActivityAt updates
  redis
    .set(`usage:project:${projectId}`, "1", { nx: true, ex: THROTTLE_SECONDS })
    .then((result) => {
      if (result === "OK") {
        return db
          .update(projects)
          .set({ lastActivityAt: now })
          .where(eq(projects.id, projectId));
      }
    })
    .catch((error: unknown) => {
      console.error(
        `Failed to update lastActivityAt for project ${projectId}:`,
        error,
      );
    });
}
