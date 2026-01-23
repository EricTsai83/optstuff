/**
 * Normalizes a slug by converting to lowercase and stripping leading/trailing hyphens.
 */
function normalizeSlug(slug: string): string {
  return slug.toLowerCase().replace(/^-+|-+$/g, "");
}

/**
 * Generates a URL-friendly slug from a name.
 */
export function generateSlug(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return normalizeSlug(slug);
}

/**
 * Generates a random hex string (works in both browser and Node.js).
 */
function randomHex(bytes: number): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    // Browser environment
    const array = new Uint8Array(bytes);
    crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
  } else {
    // Node.js environment (fallback)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { randomBytes } = require("crypto") as typeof import("crypto");
    return randomBytes(bytes).toString("hex");
  }
}

/**
 * Generates a unique slug by appending a timestamp and a random suffix.
 * If the name produces an empty slug, uses "item" as a fallback.
 */
export function generateUniqueSlug(name: string): string {
  let baseSlug = generateSlug(name);

  // Fallback to "item" if the slug is empty
  if (!baseSlug) {
    baseSlug = "item";
  }

  const timestamp = Date.now().toString(36);
  const randomSuffix = randomHex(4);

  return normalizeSlug(`${baseSlug}-${timestamp}-${randomSuffix}`);
}

/**
 * Generates a random slug with optional prefix.
 * Useful for generating team slugs on the client side.
 */
export function generateRandomSlug(prefix = "team"): string {
  const randomSuffix = randomHex(4);
  return `${prefix}-${randomSuffix}`;
}
