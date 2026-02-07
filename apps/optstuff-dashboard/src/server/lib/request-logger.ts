import { lt } from "drizzle-orm";

import { db } from "@/server/db";
import { requestLogs } from "@/server/db/schema";

/**
 * Request log entry data
 */
export type RequestLogData = {
  sourceUrl: string;
  status: "success" | "error" | "forbidden" | "rate_limited";
  processingTimeMs?: number;
  originalSize?: number;
  optimizedSize?: number;
};

/**
 * Configuration for request log retention
 */
const RETENTION_DAYS = 30;

/**
 * Probability of triggering cleanup on each request (1% = 0.01)
 * This distributes cleanup work across requests instead of needing a cron job
 */
const CLEANUP_PROBABILITY = 0.01;

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
 * Probabilistic cleanup - runs cleanup with a small probability on each call.
 * This distributes the cleanup work across requests.
 */
async function maybeCleanupOldLogs() {
  // Only run cleanup ~1% of the time
  if (Math.random() > CLEANUP_PROBABILITY) {
    return;
  }

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

    const deleted = await db
      .delete(requestLogs)
      .where(lt(requestLogs.createdAt, cutoffDate))
      .returning({ id: requestLogs.id });

    if (deleted.length > 0) {
      console.log(
        `[RequestLog Cleanup] Deleted ${deleted.length} logs older than ${RETENTION_DAYS} days`,
      );
    }
  } catch (error) {
    // Silently ignore cleanup errors - don't affect the main request
    console.error("[RequestLog Cleanup] Failed:", error);
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
      status: data.status,
      processingTimeMs: data.processingTimeMs ?? null,
      originalSize: data.originalSize ?? null,
      optimizedSize: data.optimizedSize ?? null,
    });

    // Probabilistically cleanup old logs (fire-and-forget, ~1% of requests)
    maybeCleanupOldLogs().catch(() => {
      // Ignore cleanup errors
    });
  } catch (error) {
    // Log error but don't throw - we don't want to fail the image request
    console.error("Failed to log request:", error);
  }
}
