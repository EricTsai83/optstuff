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
