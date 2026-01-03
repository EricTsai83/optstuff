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
