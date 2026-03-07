import { env } from "@/env";

export type CronAuthResult =
  | { ok: true }
  | { ok: false; reason: "unauthorized" | "misconfigured" };

/**
 * Validates whether a cron request is authorized.
 *
 * In production, CRON_SECRET is required and must match the bearer token.
 * In non-production, missing CRON_SECRET is allowed for local testing.
 */
export function authorizeCronRequest(request: Request): CronAuthResult {
  const configuredSecret = env.CRON_SECRET;

  if (!configuredSecret) {
    if (env.NODE_ENV === "production") {
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
