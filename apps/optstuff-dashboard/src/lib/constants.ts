/**
 * Shared constants across the application
 */

/** Usage limits for the free plan */
export const USAGE_LIMITS = {
  requests: 10000,
  bandwidth: 1024 * 1024 * 1024, // 1GB in bytes
} as const;

/** Project colors for project icons */
export const PROJECT_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-amber-500",
  "bg-emerald-500",
] as const;

/** Generate a consistent color based on project name */
export function getProjectColor(name: string): (typeof PROJECT_COLORS)[number] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PROJECT_COLORS[Math.abs(hash) % PROJECT_COLORS.length]!;
}
