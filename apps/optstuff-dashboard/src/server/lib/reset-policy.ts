const RESET_INTERVAL_MS = 14 * 24 * 60 * 60 * 1000;

export function nextResetAt(start: Date): Date {
  return new Date(start.getTime() + RESET_INTERVAL_MS);
}

/** Missing or malformed configuration must never permit deletions. */
export function protectedResetUsers(
  value: string | undefined,
): string[] | null {
  const ids = value?.split(",").map((id) => id.trim());
  if (!ids?.length || ids.some((id) => !/^user_[A-Za-z0-9]+$/.test(id))) {
    return null;
  }
  return [...new Set(ids)];
}

export type ResetCycle = {
  nextResetAt: Date | null;
  lastResetAt: Date | null;
};

/** Visits resume paused cycles; active cycles never extend on ordinary visits. */
export function resetCycleAction(
  cycle: ResetCycle,
  now: Date,
): "continue" | "start" | "reset" {
  if (cycle.nextResetAt === null) return "start";
  return cycle.nextResetAt.getTime() <= now.getTime() ? "reset" : "continue";
}

export function demoResetProtectedUsers(
  enabled: string | undefined,
  protectedIds: string | undefined,
): string[] | null {
  return enabled === "true" ? protectedResetUsers(protectedIds) : null;
}
