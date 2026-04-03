import { NextResponse } from "next/server";

import { authorizeCronRequest } from "@/server/lib/cron-auth";
import { runDailyMaintenance } from "@/server/lib/daily-maintenance";

/**
 * Executes daily maintenance jobs through the cron endpoint.
 *
 * This handler first validates request authorization, then runs the maintenance
 * pipeline. It returns:
 * - `401` when the bearer token is invalid
 * - `500` when production is missing `CRON_SECRET` or when maintenance fails
 * - `200` when all maintenance jobs succeed
 *
 * @param request - Incoming HTTP request from Vercel Cron or manual trigger.
 * @returns JSON response containing either an error or maintenance execution result.
 */
export async function GET(request: Request) {
  const authResult = authorizeCronRequest(request);
  if (!authResult.ok) {
    if (authResult.reason === "misconfigured") {
      return NextResponse.json(
        {
          error: "Server misconfigured: CRON_SECRET is required in production",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runDailyMaintenance();
  const status = result.ok ? 200 : 500;

  return NextResponse.json(result, { status });
}
