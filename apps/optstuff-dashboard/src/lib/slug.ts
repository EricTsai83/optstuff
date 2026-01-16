/**
 * Generates a URL-friendly slug from a name.
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Generates a unique slug by appending a timestamp.
 */
export function generateUniqueSlug(name: string): string {
  return `${generateSlug(name)}-${Date.now().toString(36)}`;
}
