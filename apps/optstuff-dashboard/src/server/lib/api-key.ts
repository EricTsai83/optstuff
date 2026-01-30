import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const API_KEY_PREFIX = "pk_";
const SECRET_KEY_PREFIX = "sk_";
const API_KEY_LENGTH = 32; // 32 bytes = 64 hex chars
const SECRET_KEY_LENGTH = 32; // 32 bytes = 64 hex chars

/**
 * Generates a new API key with a prefix for identification.
 *
 * @returns Object containing:
 *   - key: The full API key (stored in DB and shown to user)
 *   - keyPrefix: The first 12 chars of the key for display purposes
 *   - secretKey: Secret key for signing URLs
 */
export function generateApiKey(): {
  key: string;
  keyPrefix: string;
  secretKey: string;
} {
  // Generate random bytes and convert to hex
  const randomPart = randomBytes(API_KEY_LENGTH).toString("hex");
  const key = `${API_KEY_PREFIX}${randomPart}`;

  // Extract prefix for display (e.g., "pk_abc123...")
  const keyPrefix = key.substring(0, 12);

  // Generate secret key for URL signing
  const secretKey = `${SECRET_KEY_PREFIX}${randomBytes(SECRET_KEY_LENGTH).toString("hex")}`;

  return { key, keyPrefix, secretKey };
}

/**
 * Creates a signature for a URL path using HMAC-SHA256.
 *
 * @param secretKey - The secret key for signing
 * @param path - The path to sign (operations + image URL)
 * @param expiresAt - Optional expiration timestamp
 * @returns Base64URL encoded signature
 */
export function createUrlSignature(
  secretKey: string,
  path: string,
  expiresAt?: number,
): string {
  const payload = expiresAt ? `${path}?exp=${expiresAt}` : path;
  const signature = createHmac("sha256", secretKey).update(payload).digest();
  // Use base64url encoding for URL-safe signatures
  return signature.toString("base64url").substring(0, 32); // Truncate for shorter URLs
}

/**
 * Verifies a URL signature.
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @param secretKey - The secret key used for signing
 * @param path - The path that was signed
 * @param signature - The signature to verify
 * @param expiresAt - Optional expiration timestamp
 * @returns true if signature is valid
 */
export function verifyUrlSignature(
  secretKey: string,
  path: string,
  signature: string,
  expiresAt?: number,
): boolean {
  // Check expiration first
  if (expiresAt && Date.now() > expiresAt * 1000) {
    return false;
  }

  const expectedSignature = createUrlSignature(secretKey, path, expiresAt);

  // Use constant-time comparison
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(sigBuffer, expectedBuffer);
}
