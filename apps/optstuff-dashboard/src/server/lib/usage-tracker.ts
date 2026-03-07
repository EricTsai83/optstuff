/**
 * API Key usage tracking utilities.
 *
 * Responsibilities:
 * 1) Throttle metadata writes (api key/project last-used timestamps).
 * 2) Buffer usage counters in Redis and flush them to `usage_record` in batches.
 *
 * This avoids per-request counter upserts on the hot path and works safely in
 * serverless environments (no reliance on in-memory timers or process-local state).
 */

import { eq, inArray, sql } from "drizzle-orm";

import { db } from "@/server/db";
import {
  apiKeys,
  projects,
  usageBufferFlushLedger,
  usageRecords,
} from "@/server/db/schema";
import { getRedis } from "@/server/lib/redis";

/**
 * Minimum interval (in seconds) between DB writes for the same key.
 * Redis SET NX with EX ensures only one write passes through per interval,
 * even across multiple serverless instances.
 */
const THROTTLE_SECONDS = 30;
const USAGE_BUFFER_KEY_PREFIX = "usage:buffer:minute";
const USAGE_BUFFER_KEY_SCAN_PATTERN = `${USAGE_BUFFER_KEY_PREFIX}:*`;
// Keep buckets for two weeks so low-frequency cron schedules still have retry room.
const USAGE_BUFFER_TTL_SECONDS = 14 * 24 * 60 * 60;
const USAGE_BUFFER_SAFE_LAG_MINUTES = 2;
const USAGE_BUFFER_FLUSH_LOCK_KEY = "usage:buffer:flush:lock";
const USAGE_BUFFER_FLUSH_LOCK_TTL_SECONDS = 55;
const USAGE_BUFFER_LAST_FLUSH_RUN_AT_KEY = "usage:buffer:flush:last_run_at";
const USAGE_BUFFER_LAST_FLUSH_SUCCESS_AT_KEY =
  "usage:buffer:flush:last_success_at";
const FIELD_DELIMITER = "|";
const FIELD_REQUESTS = "req";
const FIELD_BYTES = "bytes";
const RELEASE_FLUSH_LOCK_SCRIPT = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
end
return 0
`;
const BUFFER_USAGE_INCREMENT_SCRIPT = `
local ttl = tonumber(ARGV[1])
local requestCount = tonumber(ARGV[2])
local bytesProcessed = tonumber(ARGV[3])

if requestCount and requestCount > 0 then
  redis.call("HINCRBY", KEYS[1], ARGV[4], requestCount)
end

if bytesProcessed and bytesProcessed > 0 then
  redis.call("HINCRBY", KEYS[1], ARGV[5], bytesProcessed)
end

redis.call("EXPIRE", KEYS[1], ttl)
return 1
`;

type UsageMetricField = typeof FIELD_REQUESTS | typeof FIELD_BYTES;

type UsageBufferInput = {
  readonly projectId: string;
  readonly apiKeyId: string;
  readonly requestCount?: number;
  readonly bytesProcessed?: number;
};

type AggregatedUsageRow = {
  projectId: string;
  apiKeyId: string | null;
  date: string;
  requestCount: number;
  bytesProcessed: number;
};

export type UsageBufferFlushStatus = {
  lastFlushRunAt: Date | null;
  lastFlushSuccessAt: Date | null;
};

function toUtcMinuteBucket(date: Date): string {
  const iso = date.toISOString();
  return `${iso.slice(0, 4)}${iso.slice(5, 7)}${iso.slice(8, 10)}${iso.slice(11, 13)}${iso.slice(14, 16)}`;
}

function getUsageBufferKey(bucket: string): string {
  return `${USAGE_BUFFER_KEY_PREFIX}:${bucket}`;
}

function getBucketFromUsageBufferKey(key: string): string | null {
  const bucket = key.split(":").at(-1);
  if (!bucket || !/^\d{12}$/.test(bucket)) return null;
  return bucket;
}

function bucketToUsageDate(bucket: string): string {
  return `${bucket.slice(0, 4)}-${bucket.slice(4, 6)}-${bucket.slice(6, 8)}`;
}

function encodeUsageField(
  projectId: string,
  apiKeyId: string,
  field: UsageMetricField,
): string {
  return `${projectId}${FIELD_DELIMITER}${apiKeyId}${FIELD_DELIMITER}${field}`;
}

function decodeUsageField(
  rawField: string,
): { projectId: string; apiKeyId: string; field: UsageMetricField } | null {
  const [projectId, apiKeyId, field] = rawField.split(FIELD_DELIMITER);
  if (
    !projectId ||
    !apiKeyId ||
    (field !== FIELD_REQUESTS && field !== FIELD_BYTES)
  ) {
    return null;
  }

  return { projectId, apiKeyId, field };
}

function shouldFlushBucket(bucket: string, now: Date): boolean {
  const cutoff = new Date(now);
  cutoff.setUTCMinutes(cutoff.getUTCMinutes() - USAGE_BUFFER_SAFE_LAG_MINUTES);
  const cutoffBucket = toUtcMinuteBucket(cutoff);
  return bucket < cutoffBucket;
}

function parseUsageBufferHash(
  bucket: string,
  hash: Record<string, string>,
): AggregatedUsageRow[] {
  const date = bucketToUsageDate(bucket);
  const byKey = new Map<string, AggregatedUsageRow>();

  for (const [rawField, rawValue] of Object.entries(hash)) {
    const decoded = decodeUsageField(rawField);
    if (!decoded) continue;

    const numericValue = Number.parseInt(rawValue, 10);
    if (!Number.isFinite(numericValue) || numericValue <= 0) continue;

    const mapKey = `${decoded.projectId}${FIELD_DELIMITER}${decoded.apiKeyId}`;
    const existing = byKey.get(mapKey) ?? {
      projectId: decoded.projectId,
      apiKeyId: decoded.apiKeyId,
      date,
      requestCount: 0,
      bytesProcessed: 0,
    };

    if (decoded.field === FIELD_REQUESTS) {
      existing.requestCount += numericValue;
    } else {
      existing.bytesProcessed += numericValue;
    }

    byKey.set(mapKey, existing);
  }

  return [...byKey.values()].filter(
    (row) => row.requestCount > 0 || row.bytesProcessed > 0,
  );
}

async function listUsageBufferKeys(): Promise<string[]> {
  const redis = getRedis();
  const keys: string[] = [];
  let cursor = "0";

  do {
    const result = await redis.scan(cursor, {
      match: USAGE_BUFFER_KEY_SCAN_PATTERN,
      count: 100,
    });
    cursor = result[0];
    keys.push(...result[1]);
  } while (cursor !== "0");

  return keys;
}

async function acquireFlushLock(): Promise<string | null> {
  const redis = getRedis();
  const token = `${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
  const acquired = await redis.set(USAGE_BUFFER_FLUSH_LOCK_KEY, token, {
    nx: true,
    ex: USAGE_BUFFER_FLUSH_LOCK_TTL_SECONDS,
  });
  return acquired === "OK" ? token : null;
}

async function releaseFlushLock(token: string): Promise<void> {
  const redis = getRedis();
  await redis.eval(RELEASE_FLUSH_LOCK_SCRIPT, [USAGE_BUFFER_FLUSH_LOCK_KEY], [
    token,
  ]);
}

function parseTimestamp(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function persistFlushTimestamps(markSuccess: boolean): Promise<void> {
  const redis = getRedis();
  const nowIso = new Date().toISOString();
  await redis.set(USAGE_BUFFER_LAST_FLUSH_RUN_AT_KEY, nowIso);
  if (markSuccess) {
    await redis.set(USAGE_BUFFER_LAST_FLUSH_SUCCESS_AT_KEY, nowIso);
  }
}

/**
 * Reads global usage-buffer flush timestamps for UI observability.
 */
export async function getUsageBufferFlushStatus(): Promise<UsageBufferFlushStatus> {
  const redis = getRedis();
  const [lastRunRaw, lastSuccessRaw] = await Promise.all([
    redis.get<string>(USAGE_BUFFER_LAST_FLUSH_RUN_AT_KEY),
    redis.get<string>(USAGE_BUFFER_LAST_FLUSH_SUCCESS_AT_KEY),
  ]);

  return {
    lastFlushRunAt: parseTimestamp(lastRunRaw),
    lastFlushSuccessAt: parseTimestamp(lastSuccessRaw),
  };
}

async function flushSingleBufferKey(
  redisKey: string,
  bucket: string,
): Promise<{ upsertedRows: number; totalRequests: number; totalBytes: number }> {
  const redis = getRedis();
  const hash = await redis.hgetall<Record<string, string>>(redisKey);
  if (!hash || Object.keys(hash).length === 0) {
    await redis.del(redisKey);
    return { upsertedRows: 0, totalRequests: 0, totalBytes: 0 };
  }

  const rows = parseUsageBufferHash(bucket, hash);
  if (rows.length === 0) {
    await redis.del(redisKey);
    return { upsertedRows: 0, totalRequests: 0, totalBytes: 0 };
  }

  const projectIds = [...new Set(rows.map((row) => row.projectId))];
  const apiKeyIds = [
    ...new Set(
      rows
        .map((row) => row.apiKeyId)
        .filter((apiKeyId): apiKeyId is string => apiKeyId !== null),
    ),
  ];
  const [existingProjects, existingApiKeys] = await Promise.all([
    projectIds.length > 0
      ? db
          .select({ id: projects.id })
          .from(projects)
          .where(inArray(projects.id, projectIds))
      : Promise.resolve([] as Array<{ id: string }>),
    apiKeyIds.length > 0
      ? db
          .select({ id: apiKeys.id })
          .from(apiKeys)
          .where(inArray(apiKeys.id, apiKeyIds))
      : Promise.resolve([] as Array<{ id: string }>),
  ]);

  const projectsSet = new Set(existingProjects.map((project) => project.id));
  const apiKeysSet = new Set(existingApiKeys.map((apiKey) => apiKey.id));
  const filteredRows = rows.filter(
    (row) =>
      projectsSet.has(row.projectId) &&
      (row.apiKeyId === null || apiKeysSet.has(row.apiKeyId)),
  );
  if (filteredRows.length === 0) {
    await redis.del(redisKey);
    return { upsertedRows: 0, totalRequests: 0, totalBytes: 0 };
  }

  const totalRequests = filteredRows.reduce(
    (sum, row) => sum + row.requestCount,
    0,
  );
  const totalBytes = filteredRows.reduce((sum, row) => sum + row.bytesProcessed, 0);
  let shouldApplyRows = false;

  await db.transaction(async (tx) => {
    const [ledgerClaim] = await tx
      .insert(usageBufferFlushLedger)
      .values({
        bucket,
        rowCount: filteredRows.length,
        totalRequests,
        totalBytes,
      })
      .onConflictDoNothing()
      .returning({ bucket: usageBufferFlushLedger.bucket });

    // Already flushed in an earlier successful commit (for example after a
    // worker crash before Redis cleanup) - skip additive replay.
    if (!ledgerClaim) return;
    shouldApplyRows = true;

    for (const row of filteredRows) {
      await tx
        .insert(usageRecords)
        .values({
          projectId: row.projectId,
          apiKeyId: row.apiKeyId,
          date: row.date,
          requestCount: row.requestCount,
          bytesProcessed: row.bytesProcessed,
        })
        .onConflictDoUpdate({
          target: [usageRecords.projectId, usageRecords.apiKeyId, usageRecords.date],
          targetWhere: sql`${usageRecords.apiKeyId} IS NOT NULL`,
          set: {
            requestCount: sql`${usageRecords.requestCount} + ${row.requestCount}`,
            bytesProcessed: sql`${usageRecords.bytesProcessed} + ${row.bytesProcessed}`,
          },
        });
    }
  });

  await redis.del(redisKey);

  if (!shouldApplyRows) {
    return { upsertedRows: 0, totalRequests: 0, totalBytes: 0 };
  }

  return {
    upsertedRows: filteredRows.length,
    totalRequests,
    totalBytes,
  };
}

/**
 * Buffer usage increments in Redis minute buckets.
 * Non-blocking helper for request hot path.
 */
export function bufferUsageIncrement(input: UsageBufferInput): void {
  const requestCount = Math.max(0, Math.trunc(input.requestCount ?? 0));
  const bytesProcessed = Math.max(0, Math.trunc(input.bytesProcessed ?? 0));
  if (requestCount === 0 && bytesProcessed === 0) return;

  const redis = getRedis();
  const bucket = toUtcMinuteBucket(new Date());
  const key = getUsageBufferKey(bucket);

  void redis
    .eval(BUFFER_USAGE_INCREMENT_SCRIPT, [key], [
      String(USAGE_BUFFER_TTL_SECONDS),
      String(requestCount),
      String(bytesProcessed),
      encodeUsageField(input.projectId, input.apiKeyId, FIELD_REQUESTS),
      encodeUsageField(input.projectId, input.apiKeyId, FIELD_BYTES),
    ])
    .catch((error: unknown) => {
      console.error(
        `Failed to buffer usage increment (project=${input.projectId}, key=${input.apiKeyId}):`,
        error,
      );
    });
}

export type UsageBufferFlushResult = {
  ok: boolean;
  skippedByLock: boolean;
  scannedKeys: number;
  processedKeys: number;
  skippedRecentKeys: number;
  upsertedRows: number;
  totalRequests: number;
  totalBytes: number;
  failedKeys: number;
  durationMs: number;
  error?: string;
};

/**
 * Flush ready Redis usage buckets into `usage_record`.
 */
export async function flushUsageBufferToDatabase(
  now = new Date(),
): Promise<UsageBufferFlushResult> {
  const startedAt = Date.now();
  const lockToken = await acquireFlushLock();
  if (!lockToken) {
    return {
      ok: true,
      skippedByLock: true,
      scannedKeys: 0,
      processedKeys: 0,
      skippedRecentKeys: 0,
      upsertedRows: 0,
      totalRequests: 0,
      totalBytes: 0,
      failedKeys: 0,
      durationMs: Date.now() - startedAt,
    };
  }

  try {
    const keys = await listUsageBufferKeys();
    let processedKeys = 0;
    let skippedRecentKeys = 0;
    let upsertedRows = 0;
    let totalRequests = 0;
    let totalBytes = 0;
    let failedKeys = 0;

    for (const redisKey of keys) {
      const bucket = getBucketFromUsageBufferKey(redisKey);
      if (!bucket) continue;
      if (!shouldFlushBucket(bucket, now)) {
        skippedRecentKeys += 1;
        continue;
      }

      try {
        const flushed = await flushSingleBufferKey(redisKey, bucket);
        processedKeys += 1;
        upsertedRows += flushed.upsertedRows;
        totalRequests += flushed.totalRequests;
        totalBytes += flushed.totalBytes;
      } catch (error) {
        failedKeys += 1;
        console.error(
          `[UsageBufferFlush] Failed to flush key ${redisKey}:`,
          error,
        );
      }
    }

    const result: UsageBufferFlushResult = {
      ok: failedKeys === 0,
      skippedByLock: false,
      scannedKeys: keys.length,
      processedKeys,
      skippedRecentKeys,
      upsertedRows,
      totalRequests,
      totalBytes,
      failedKeys,
      durationMs: Date.now() - startedAt,
    };
    await persistFlushTimestamps(result.ok).catch((error: unknown) => {
      console.warn("[UsageBufferFlush] Failed to persist flush timestamps:", error);
    });
    return result;
  } catch (error) {
    await persistFlushTimestamps(false).catch((persistError: unknown) => {
      console.warn(
        "[UsageBufferFlush] Failed to persist failed-flush timestamp:",
        persistError,
      );
    });
    return {
      ok: false,
      skippedByLock: false,
      scannedKeys: 0,
      processedKeys: 0,
      skippedRecentKeys: 0,
      upsertedRows: 0,
      totalRequests: 0,
      totalBytes: 0,
      failedKeys: 0,
      durationMs: Date.now() - startedAt,
      error: String(error),
    };
  } finally {
    await releaseFlushLock(lockToken).catch(() => undefined);
  }
}

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
