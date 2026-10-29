import { z } from "zod";

import type { db } from "@/server/db";
import { apiKeys, maintenanceRetryTasks } from "@/server/db/schema";
import { inArray } from "drizzle-orm";
import { invalidateProjectCache, markApiKeyCacheRevoked } from "./config-cache";
import { clearProjectUsageBuffer } from "./usage-tracker";

export const CLEANUP_DELETED_PROJECT = "cleanup_deleted_project";
export const REVOKE_DELETED_API_KEY = "revoke_deleted_api_key";
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Queue cleanup in the same transaction as deletion, so crashes cannot lose it. */
export async function queueDeletedProjectCleanup(
  tx: Transaction,
  deletedProjects: { id: string; slug: string }[],
): Promise<void> {
  if (deletedProjects.length === 0) return;
  const keys = await tx
    .select({ publicKey: apiKeys.publicKey })
    .from(apiKeys)
    .where(
      inArray(
        apiKeys.projectId,
        deletedProjects.map((p) => p.id),
      ),
    );
  const tasks = [
    ...deletedProjects.map((project) => ({
      taskType: CLEANUP_DELETED_PROJECT,
      taskKey: JSON.stringify(project),
    })),
    ...keys.map((key) => ({
      taskType: REVOKE_DELETED_API_KEY,
      taskKey: key.publicKey,
    })),
  ];
  await tx.insert(maintenanceRetryTasks).values(tasks).onConflictDoNothing();
}

const deletedProjectSchema = z.object({ id: z.uuid(), slug: z.string() });

export async function cleanupDeletedProject(taskKey: string): Promise<void> {
  const project = deletedProjectSchema.parse(JSON.parse(taskKey) as unknown);
  await invalidateProjectCache(project.slug, project.id);
  await clearProjectUsageBuffer(project.id);
}

export async function revokeDeletedApiKey(publicKey: string): Promise<void> {
  await markApiKeyCacheRevoked(publicKey);
}
