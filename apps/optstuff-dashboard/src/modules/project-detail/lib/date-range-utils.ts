/** Represents a date range with an optional end date, used across all date-related filtering UI. */
export type DateRange = {
  from: Date | undefined;
  to?: Date | undefined;
};

/** Pre-defined time window options shown in the {@link TimePresetPicker}. */
export const TIME_PRESETS = [
  { label: "Last 7 Days", value: "7", days: 7 },
  { label: "Last 14 Days", value: "14", days: 14 },
  { label: "Last 30 Days", value: "30", days: 30 },
  { label: "Last 90 Days", value: "90", days: 90 },
] as const;

/** Available request status filter options for the usage logs. */
export const STATUS_OPTIONS = [
  { label: "Success", value: "success" },
  { label: "Error", value: "error" },
  { label: "Forbidden", value: "forbidden" },
  { label: "Rate Limited", value: "rate_limited" },
] as const;

/**
 * Calculates the percentage change between two periods.
 *
 * @param current - The value for the current period.
 * @param previous - The value for the previous (comparison) period.
 * @returns A rounded percentage change (e.g. `25` means +25%). Returns `100` if previous is 0 and current > 0.
 */
export function calcTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Builds a date range ending at the end of today and spanning `numDays` days back.
 *
 * @param numDays - Number of days to include in the range.
 * @returns An object with `from` (start of range) and `to` (end of today).
 */
export function getDateRangeFromDays(numDays: number): {
  from: Date;
  to: Date;
} {
  const to = new Date();
  to.setUTCHours(23, 59, 59, 999);
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - (numDays - 1));
  from.setUTCHours(0, 0, 0, 0);
  return { from, to };
}

const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

/**
 * Parses a fixed-date string in slash format (`1/15`) or named format (`Jan 15`)
 * and returns a `Date` in the current year. Returns `null` if the input is invalid.
 */
function parseFixedDate(input: string): Date | null {
  const s = input.trim();
  const year = new Date().getFullYear();

  const slashMatch = /^(\d{1,2})\/(\d{1,2})$/.exec(s);
  if (slashMatch) {
    const m = Number(slashMatch[1]) - 1;
    const d = Number(slashMatch[2]);
    if (m >= 0 && m < 12 && d >= 1 && d <= 31) {
      const date = new Date(year, m, d);
      if (
        date.getFullYear() === year &&
        date.getMonth() === m &&
        date.getDate() === d
      )
        return date;
    }
  }

  const nameMatch =
    /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{1,2})$/i.exec(
      s,
    );
  if (nameMatch) {
    const m = MONTHS[nameMatch[1]!.toLowerCase().slice(0, 3)]!;
    const d = Number(nameMatch[2]);
    if (d >= 1 && d <= 31) {
      const date = new Date(year, m, d);
      if (
        date.getFullYear() === year &&
        date.getMonth() === m &&
        date.getDate() === d
      )
        return date;
    }
  }

  return null;
}

/**
 * Parses a free-form time input string into a {@link DateRange}.
 *
 * Supports:
 * - Keywords: `"today"`, `"yesterday"`, `"last week"`, `"last month"`
 * - Relative durations: `"45m"`, `"12 hours"`, `"10d"`, `"2 weeks"`
 * - Fixed dates: `"Jan 15"`, `"1/15"`
 * - Fixed ranges: `"Jan 1 - Jan 15"`, `"1/1 - 1/15"`
 *
 * @param input - The raw user input string.
 * @returns A `DateRange` if parsing succeeds, or `null` if the input is unrecognised.
 */
export function parseTimeInput(input: string): DateRange | null {
  const s = input.trim().toLowerCase();
  if (!s) return null;

  const now = new Date();

  if (s === "today") {
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    return { from, to: now };
  }
  if (s === "yesterday") {
    const from = new Date(now);
    from.setDate(from.getDate() - 1);
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }
  if (s === "last month") {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { from, to };
  }
  if (s === "last week") {
    const from = new Date(now);
    from.setDate(from.getDate() - 7);
    from.setHours(0, 0, 0, 0);
    return { from, to: now };
  }

  const relMatch =
    /^(\d+)\s*(m|min|mins|minutes?|h|hr|hrs|hours?|d|days?|w|weeks?)$/.exec(s);
  if (relMatch) {
    const n = Number(relMatch[1]);
    const u = relMatch[2]!;
    const from = new Date(now);
    if (u.startsWith("m")) from.setMinutes(from.getMinutes() - n);
    else if (u.startsWith("h")) from.setHours(from.getHours() - n);
    else if (u.startsWith("d")) from.setDate(from.getDate() - n);
    else if (u.startsWith("w")) from.setDate(from.getDate() - n * 7);
    return { from, to: now };
  }

  if (/[-–]/.test(s)) {
    const parts = s.split(/\s*[-–]\s*/);
    if (parts.length === 2) {
      const from = parseFixedDate(parts[0]!);
      const to = parseFixedDate(parts[1]!);
      if (from && to) {
        if (from.getTime() > to.getTime()) return null;
        to.setHours(23, 59, 59, 999);
        return { from, to };
      }
    }
  } else {
    const single = parseFixedDate(s);
    if (single) {
      const to = new Date(single);
      to.setHours(23, 59, 59, 999);
      return { from: single, to };
    }
  }

  return null;
}
