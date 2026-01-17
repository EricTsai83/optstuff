import { createHash, randomBytes, timingSafeEqual } from "crypto";

const API_KEY_PREFIX = "pk_";
const API_KEY_LENGTH = 32; // 32 bytes = 64 hex chars

/**
 * Generates a new API key with a prefix for identification.
 * Returns both the full key (to show to user once) and the hash (to store in DB).
 *
 * @returns Object containing:
 *   - key: The full API key to show to the user (only shown once)
 *   - keyPrefix: The first 8 chars of the key for display purposes
 *   - keyHash: SHA256 hash of the key to store in database
 */
export function generateApiKey(): {
  key: string;
  keyPrefix: string;
  keyHash: string;
} {
  // Generate random bytes and convert to hex
  const randomPart = randomBytes(API_KEY_LENGTH).toString("hex");
  const key = `${API_KEY_PREFIX}${randomPart}`;

  // Extract prefix for display (e.g., "pk_abc123...")
  const keyPrefix = key.substring(0, 12);

  // Hash the key for storage
  const keyHash = hashApiKey(key);

  return { key, keyPrefix, keyHash };
}

/**
 * Hashes an API key using SHA256.
 * This is used for both storing and verifying keys.
 *
 * @param key - The full API key to hash
 * @returns SHA256 hash of the key
 */
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Verifies if a provided API key matches a stored hash.
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @param key - The API key to verify
 * @param storedHash - The hash stored in the database
 * @returns true if the key matches the hash
 */
export function verifyApiKey(key: string, storedHash: string): boolean {
  const keyHash = hashApiKey(key);

  const keyHashBuffer = Buffer.from(keyHash, "hex");
  const storedHashBuffer = Buffer.from(storedHash, "hex");

  // Length mismatch - return false without leaking timing info
  if (keyHashBuffer.length !== storedHashBuffer.length) {
    return false;
  }

  return timingSafeEqual(keyHashBuffer, storedHashBuffer);
}
