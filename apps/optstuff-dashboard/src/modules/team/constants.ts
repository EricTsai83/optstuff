/**
 * Scroll-related configuration constants
 */
export const SCROLL_CONFIG = {
  /** Maximum scroll distance (px) */
  MAX_SCROLL: 64,
  /** Logo animation configuration */
  LOGO: {
    /** Logo minimum size (px) */
    MIN_SIZE: 24,
    /** Logo maximum size (px) */
    MAX_SIZE: 28,
    /** Logo minimum top position (px) */
    MIN_TOP: 23,
    /** Logo maximum top position (px) */
    MAX_TOP: 32,
  },
  /** Navigation tabs animation configuration */
  NAVIGATION_TABS: {
    /** Multiplier coefficient for translateX */
    TRANSLATE_X_MULTIPLIER: 0.8,
  },
} as const;

export const NAV_TABS = ["Overview", "Usage", "Settings"] as const;

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
