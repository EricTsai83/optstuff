/**
 * Shared formatting utilities
 */

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(k)),
    sizes.length - 1,
  );
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * Format number with K, M, B, T suffix
 */
export function formatNumber(num: number) {
  if (num >= 1_000_000_000_000) {
    return (num / 1_000_000_000_000).toFixed(1) + "T";
  }
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1) + "B";
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + "K";
  }
  return num.toString();
}

/**
 * Format bytes and return value and unit separately.
 */
export function formatBytesParts(bytes: number): { value: string; unit: string } {
  if (bytes === 0) return { value: "0", unit: "B" };
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(k)),
    sizes.length - 1,
  );
  return {
    value: parseFloat((bytes / Math.pow(k, i)).toFixed(1)).toString(),
    unit: sizes[i]!,
  };
}

/**
 * Format number and return value and unit separately.
 */
export function formatNumberParts(num: number): { value: string; unit: string } {
  if (num >= 1_000_000_000_000) {
    return { value: (num / 1_000_000_000_000).toFixed(1), unit: "T" };
  }
  if (num >= 1_000_000_000) {
    return { value: (num / 1_000_000_000).toFixed(1), unit: "B" };
  }
  if (num >= 1_000_000) {
    return { value: (num / 1_000_000).toFixed(1), unit: "M" };
  }
  if (num >= 1_000) {
    return { value: (num / 1_000).toFixed(1), unit: "K" };
  }
  return { value: num.toLocaleString(), unit: "" };
}

/**
 * Get date range for last N days
 */
export function getDateRange(days: number) {
  const today = new Date();
  const startDay = new Date(today);
  startDay.setDate(startDay.getDate() - days);

  return {
    startDate: startDay.toISOString().split("T")[0]!,
    endDate: today.toISOString().split("T")[0]!,
  };
}

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
export function getToday() {
  return new Date().toISOString().split("T")[0]!;
}
