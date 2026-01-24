import { db } from "@/server/db";
import { requestLogs } from "@/server/db/schema";

/**
 * Request log entry data
 */
export type RequestLogData = {
  sourceUrl: string;
  status: "success" | "error" | "forbidden";
  processingTimeMs?: number;
  originalSize?: number;
  optimizedSize?: number;
};

/**
 * Log a request to the database
 * This is fire-and-forget - we don't wait for the result
 *
 * @param projectId - Project ID
 * @param data - Request log data
 */
export async function logRequest(
  projectId: string,
  data: RequestLogData,
): Promise<void> {
  try {
    await db.insert(requestLogs).values({
      projectId,
      sourceUrl: data.sourceUrl,
      status: data.status,
      processingTimeMs: data.processingTimeMs ?? null,
      originalSize: data.originalSize ?? null,
      optimizedSize: data.optimizedSize ?? null,
    });
  } catch (error) {
    // Log error but don't throw - we don't want to fail the image request
    console.error("Failed to log request:", error);
  }
}
