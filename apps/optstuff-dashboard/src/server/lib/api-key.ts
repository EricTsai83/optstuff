import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  hkdfSync,
  randomBytes,
  timingSafeEqual,
} from "crypto";

import { env } from "@/env";
import type { Result } from "@/lib/types";

const PUBLIC_KEY_PREFIX = "pk_";
const SECRET_KEY_PREFIX = "sk_";
const PUBLIC_KEY_LENGTH = 16; // 16 bytes → 22 base64url chars (128 bits entropy)
const SECRET_KEY_LENGTH = 32; // 32 bytes → ~43 base64url chars (no padding)

// AES-256-GCM encryption constants
const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const ENCRYPTION_KEY_LENGTH = 32; // 256 bits for AES-256

// HKDF constants (RFC 5869)
const HKDF_ALGORITHM = "sha256"; // 底層 hash 算法
const HKDF_SALT = "optstuff-api-key-v1"; // Versioned salt for future key rotation
const HKDF_INFO_ENCRYPTION = "api-key-encryption"; // Context for encryption key derivation

/**
 * Derives a 32-byte encryption key from the master secret using HKDF (RFC 5869).
 *
 * HKDF provides better key derivation than simple hashing:
 * - Separates key material extraction from expansion
 * - Allows deriving multiple independent keys via different `info` values
 * - Industry standard for cryptographic key derivation
 */
function getEncryptionKey() {
  return Buffer.from(
    hkdfSync(
      HKDF_ALGORITHM,
      env.API_KEY_ENCRYPTION_SECRET,
      HKDF_SALT,
      HKDF_INFO_ENCRYPTION,
      ENCRYPTION_KEY_LENGTH,
    ),
  );
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 *
 * @param plaintext - The string to encrypt
 * @returns Encrypted string in format: iv:authTag:ciphertext (all base64 encoded)
 */
export function encryptApiKey(plaintext: string) {
  const iv = randomBytes(IV_LENGTH);
  const key = getEncryptionKey();

  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:ciphertext (all base64 encoded)
  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

/**
 * Decrypts an encrypted string using AES-256-GCM.
 *
 * @param encrypted - The encrypted string in format: iv:authTag:ciphertext
 * @returns Result with decrypted plaintext, or an error message string on failure
 */
export function decryptApiKey(encrypted: string): Result<string, string> {
  try {
    const parts = encrypted.split(":");
    if (parts.length !== 3) {
      return { ok: false, error: "Invalid encrypted format" };
    }

    const [ivBase64, authTagBase64, ciphertextBase64] = parts;
    if (!ivBase64 || !authTagBase64 || !ciphertextBase64) {
      return { ok: false, error: "Invalid encrypted format: missing parts" };
    }

    const iv = Buffer.from(ivBase64, "base64");
    const authTag = Buffer.from(authTagBase64, "base64");
    const ciphertext = Buffer.from(ciphertextBase64, "base64");
    const key = getEncryptionKey();

    const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return { ok: true, value: decrypted.toString("utf8") };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Generates a new API key pair: a public key for identification and a secret key for signing.
 *
 * @returns Object containing:
 *   - publicKey: Public identifier stored in plaintext (e.g., "pk_wGqLzyZob...")
 *   - secretKey: Secret key for HMAC-SHA256 URL signing (e.g., "sk_xYzAbC...")
 */
export function generateApiKey() {
  // Public key: "pk_" + 22 base64url chars = 25 chars total (128 bits entropy)
  const publicKey = `${PUBLIC_KEY_PREFIX}${randomBytes(PUBLIC_KEY_LENGTH).toString("base64url")}`;

  // Secret key for URL signing: "sk_" + ~43 base64url chars
  const secretKey = `${SECRET_KEY_PREFIX}${randomBytes(SECRET_KEY_LENGTH).toString("base64url")}`;

  return { publicKey, secretKey };
}

/**
 * Creates a signature for a URL path using HMAC-SHA256.
 *
 * @param secretKey - The secret key for signing
 * @param path - The path to sign (operations + image URL)
 * @param expiresAt - Optional expiration timestamp
 * @returns Base64URL encoded signature
 */
function createUrlSignature(
  secretKey: string,
  path: string,
  expiresAt?: number,
) {
  const payload = expiresAt ? `${path}?exp=${expiresAt}` : path;
  return createHmac("sha256", secretKey)
    .update(payload)
    .digest("base64url")
    .substring(0, 32);
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
) {
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
