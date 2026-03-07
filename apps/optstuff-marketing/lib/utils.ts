/**
 * Resolve a valid absolute URL for project-level public metadata.
 *
 * Priority:
 * 1) PROJECT_URL (as-is if already absolute, otherwise assume https://)
 * 2) VERCEL_URL (always https://)
 * 3) localhost development fallback
 */
export function getProjectBaseUrl(): URL {
  const projectUrl = process.env.PROJECT_URL?.trim();

  if (projectUrl) {
    try {
      return new URL(projectUrl);
    } catch {
      try {
        return new URL(`https://${projectUrl}`);
      } catch {
        // Intentionally fail fast so deployment config issues are visible immediately.
        throw new Error(
          `Invalid PROJECT_URL value "${projectUrl}". Set PROJECT_URL as an absolute URL (e.g. "https://example.com") or provide a valid hostname.`,
        );
      }
    }
  }

  return new URL(
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000",
  );
}
