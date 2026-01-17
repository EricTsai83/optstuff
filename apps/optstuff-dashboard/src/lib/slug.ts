import { randomBytes } from "crypto";

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
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  return normalizeSlug(slug);
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
  const randomSuffix = randomBytes(4).toString("hex");

  return normalizeSlug(`${baseSlug}-${timestamp}-${randomSuffix}`);
}
