import { NextResponse } from "next/server";

import { env } from "@/env";
import { runDailyMaintenance } from "@/server/lib/daily-maintenance";

type CronAuthResult =
  | { ok: true }
  | { ok: false; reason: "unauthorized" | "misconfigured" };

/**
 * Validates whether a cron request is authorized to execute maintenance tasks.
 *
 * In production, `CRON_SECRET` must be configured. When missing, the request is
 * treated as a server misconfiguration. In non-production environments, requests
 * are allowed without a secret to simplify local testing.
 *
 * @param request - Incoming HTTP request to the cron endpoint.
 * @returns Authorization result with either success, unauthorized, or misconfigured status.
 */
function authorizeCronRequest(request: Request): CronAuthResult {
  const configuredSecret = env.CRON_SECRET ?? process.env.CRON_SECRET;

  // Allow local manual calls when developing without a cron secret.
  if (!configuredSecret) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, reason: "misconfigured" };
    }
    return { ok: true };
  }

  const authorization = request.headers.get("authorization");
  if (authorization !== `Bearer ${configuredSecret}`) {
    return { ok: false, reason: "unauthorized" };
  }

  return { ok: true };
}

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
        { error: "Server misconfigured: CRON_SECRET is required in production" },
        { status: 500 },
      );
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runDailyMaintenance();
  const status = result.ok ? 200 : 500;

  return NextResponse.json(result, { status });
}
