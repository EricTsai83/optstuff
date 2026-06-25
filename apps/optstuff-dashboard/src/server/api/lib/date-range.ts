import { z } from "zod";

const DATE_ONLY_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MAX_ANALYTICS_RANGE_DAYS = 90;
const MAX_ANALYTICS_LOOKBACK_DAYS = 366;
const MAX_ANALYTICS_FUTURE_MS = MS_PER_DAY;

export const zDateString = z
  .string()
  .refine(
    (value) => !Number.isNaN(Date.parse(value)),
    "Invalid ISO date/datetime string",
  );

export const analyticsDateRangeFields = {
  startDate: zDateString,
  endDate: zDateString,
} as const;

export function addAnalyticsDateRangeIssue(
  value: AnalyticsDateRangeInput,
  ctx: z.RefinementCtx,
): void {
  const parsed = parseAnalyticsDateRange(value);
  if (!parsed.ok) {
    ctx.addIssue({ code: "custom", message: parsed.error });
  }
}

export const analyticsDateRangeSchema = z
  .object(analyticsDateRangeFields)
  .superRefine(addAnalyticsDateRangeIssue);

type AnalyticsDateRangeInput = {
  readonly startDate: string;
  readonly endDate: string;
};

type ParsedAnalyticsDateRange =
  | {
      readonly ok: true;
      readonly start: Date;
      readonly endExclusive: Date;
      readonly startDate: string;
      readonly endDate: string;
      readonly days: number;
    }
  | { readonly ok: false; readonly error: string };

function parseDateInput(value: string): Date | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toEndExclusive(value: string): Date | null {
  const dateOnlyMatch = DATE_ONLY_REGEX.exec(value);
  if (dateOnlyMatch) {
    const year = Number.parseInt(dateOnlyMatch[1] ?? "0", 10);
    const month = Number.parseInt(dateOnlyMatch[2] ?? "0", 10);
    const day = Number.parseInt(dateOnlyMatch[3] ?? "0", 10);

    return new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0));
  }

  return parseDateInput(value);
}

function toDateOnly(value: Date): string {
  return value.toISOString().split("T")[0]!;
}

export function parseAnalyticsDateRange(
  input: AnalyticsDateRangeInput,
): ParsedAnalyticsDateRange {
  const start = parseDateInput(input.startDate);
  const endExclusive = toEndExclusive(input.endDate);

  if (!start || !endExclusive) {
    return { ok: false, error: "Invalid date range" };
  }

  if (start >= endExclusive) {
    return { ok: false, error: "startDate must be before endDate" };
  }

  const now = Date.now();
  if (endExclusive.getTime() > now + MAX_ANALYTICS_FUTURE_MS) {
    return { ok: false, error: "Date range cannot extend into the future" };
  }

  if (start.getTime() < now - MAX_ANALYTICS_LOOKBACK_DAYS * MS_PER_DAY) {
    return {
      ok: false,
      error: `Date range cannot start more than ${MAX_ANALYTICS_LOOKBACK_DAYS} days ago`,
    };
  }

  const days = Math.ceil(
    (endExclusive.getTime() - start.getTime()) / MS_PER_DAY,
  );
  if (days > MAX_ANALYTICS_RANGE_DAYS) {
    return {
      ok: false,
      error: `Date range cannot exceed ${MAX_ANALYTICS_RANGE_DAYS} days`,
    };
  }

  return {
    ok: true,
    start,
    endExclusive,
    startDate: toDateOnly(start),
    endDate: toDateOnly(new Date(endExclusive.getTime() - 1)),
    days,
  };
}

export function getAnalyticsDateRange(input: AnalyticsDateRangeInput) {
  const parsed = parseAnalyticsDateRange(input);
  if (!parsed.ok) {
    throw new Error(parsed.error);
  }
  return parsed;
}
