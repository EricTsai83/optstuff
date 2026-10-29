import { NextResponse } from "next/server";

import { authorizeCronRequest } from "@/server/lib/cron-auth";
import { processMaintenanceRetryTasks } from "@/server/lib/daily-maintenance";
import { resetDemoUsers } from "@/server/lib/user-reset";

export const maxDuration = 60;

export async function GET(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.reason },
      {
        status: auth.reason === "misconfigured" ? 500 : 401,
      },
    );
  }
  try {
    const reset = await resetDemoUsers();
    if (reset.disabled) return NextResponse.json(reset);
    const cleanup = await processMaintenanceRetryTasks();
    return NextResponse.json(
      { ...reset, cleanup },
      {
        status:
          reset.ok &&
          cleanup.failed === 0 &&
          cleanup.exhausted === 0 &&
          cleanup.remaining === 0
            ? 200
            : 500,
      },
    );
  } catch (error) {
    console.error("[DemoReset] Weekly reset failed", error);
    return NextResponse.json(
      { ok: false, error: "Weekly reset failed" },
      { status: 500 },
    );
  }
}
