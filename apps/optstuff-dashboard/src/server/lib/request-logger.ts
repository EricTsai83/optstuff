import { lt } from "drizzle-orm";

import { db } from "@/server/db";
import { requestLogs, requestLogStatusEnum } from "@/server/db/schema";

export type RequestLogStatus = (typeof requestLogStatusEnum.enumValues)[number];

/**
 * Request log entry data
 */
export type RequestLogData = {
  sourceUrl: string;
  operations?: string;
  status: RequestLogStatus;
  errorDetail?: string;
  processingTimeMs?: number;
  originalSize?: number;
  optimizedSize?: number;
};

/**
 * Configuration for request log retention
 */
const RETENTION_DAYS = 30;

/**
 * Delete request logs older than retention window.
 * Intended to run from a scheduled cron route.
 */
export async function cleanupOldRequestLogs(
  retentionDays = RETENTION_DAYS,
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const deletedRows = await db
    .delete(requestLogs)
    .where(lt(requestLogs.createdAt, cutoffDate))
    .returning({ id: requestLogs.id });

  return deletedRows.length;
}

/**
 * Sanitize URL by removing query string and hash.
 * Keeps only the origin (protocol + host) and pathname.
 *
 * @example
 * sanitizeUrl("https://example.com/images/photo.jpg?token=abc&size=large#section")
 * // Returns: "https://example.com/images/photo.jpg"
 */
export function sanitizeUrl(url: string) {
  try {
    const parsed = new URL(url);
    // Keep only origin + pathname (removes query string and hash)
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    // If URL parsing fails, try basic string manipulation
    // Remove query string (everything after ?)
    let sanitized = url.split("?")[0] ?? url;
    // Remove hash (everything after #)
    sanitized = sanitized.split("#")[0] ?? sanitized;
    return sanitized;
  }
}

/**
 * Log a request to the database
 * This is fire-and-forget - we don't wait for the result
 *
 * @param projectId - Project ID
 * @param data - Request log data
 */
export async function logRequest(projectId: string, data: RequestLogData) {
  try {
    // Sanitize URL before storing (remove query string and hash)
    const sanitizedUrl = sanitizeUrl(data.sourceUrl);

    await db.insert(requestLogs).values({
      projectId,
      sourceUrl: sanitizedUrl,
      operations: data.operations ?? null,
      status: data.status,
      errorDetail: data.errorDetail ?? null,
      processingTimeMs: data.processingTimeMs ?? null,
      originalSize: data.originalSize ?? null,
      optimizedSize: data.optimizedSize ?? null,
    });
  } catch (error) {
    // Log error but don't throw - we don't want to fail the image request
    console.error("Failed to log request:", error);
  }
}
