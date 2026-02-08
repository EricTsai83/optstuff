import { differenceInDays } from "date-fns";

// ============================================================================
// Types
// ============================================================================

export type ApiKeyData = {
  readonly id: string;
  readonly name: string;
  readonly publicKey: string;
  readonly createdAt: Date;
  readonly lastUsedAt: Date | null;
  readonly expiresAt: Date | null;
  readonly allowedSourceDomains: string[] | null;
  readonly rateLimitPerMinute: number | null;
  readonly rateLimitPerDay: number | null;
};

export type ExpirationStatus = {
  readonly isExpired: boolean;
  readonly isExpiringSoon: boolean;
  readonly daysUntilExpiry: number | null;
};

export type RotatedKeyData = {
  readonly publicKey: string;
  readonly secretKey: string;
  readonly name: string;
};

export type EditingKeyData = {
  readonly id: string;
  readonly name: string;
  readonly allowedSourceDomains: string[] | null;
  readonly expiresAt: Date | null;
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate expiration status for an API key
 */
export function getExpirationStatus(expiresAt: Date | null) {
  if (!expiresAt) {
    return { isExpired: false, isExpiringSoon: false, daysUntilExpiry: null };
  }

  const now = new Date();
  const expiryDate = new Date(expiresAt);
  const isExpired = now.getTime() >= expiryDate.getTime();
  const daysUntilExpiry = differenceInDays(expiryDate, now);
  const isExpiringSoon =
    !isExpired && daysUntilExpiry > 0 && daysUntilExpiry <= 7;

  return { isExpired, isExpiringSoon, daysUntilExpiry };
}

/**
 * Get the status color scheme based on expiration and domain configuration
 */
export function getStatusColorScheme(
  isExpired: boolean,
  isExpiringSoon: boolean,
  hasDomains: boolean,
) {
  if (isExpired || !hasDomains) {
    return "danger";
  }
  if (isExpiringSoon) {
    return "warning";
  }
  return "success";
}

export const STATUS_COLORS = {
  danger: {
    background: "bg-red-500/10",
    text: "text-red-500",
    dot: "bg-red-500",
  },
  warning: {
    background: "bg-amber-500/10",
    text: "text-amber-500",
    dot: "bg-amber-500",
  },
  success: {
    background: "bg-green-500/10",
    text: "text-green-500",
    dot: "bg-green-500",
  },
} as const;
