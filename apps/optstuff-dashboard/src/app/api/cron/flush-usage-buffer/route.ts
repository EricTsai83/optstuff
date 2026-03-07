import { NextResponse } from "next/server";

import { authorizeCronRequest } from "@/server/lib/cron-auth";
import { flushUsageBufferToDatabase } from "@/server/lib/usage-tracker";

/**
 * Flushes buffered usage counters from Redis into `usage_record`.
 */
export async function GET(request: Request) {
  const authResult = authorizeCronRequest(request);
  if (!authResult.ok) {
    if (authResult.reason === "misconfigured") {
      return NextResponse.json(
        { error: "Server misconfigured: CRON_SECRET is required in production" },
        { status: 500 },
      );
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await flushUsageBufferToDatabase();
  const status = result.ok ? 200 : 500;
  return NextResponse.json(result, { status });
}
