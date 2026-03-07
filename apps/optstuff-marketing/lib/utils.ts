/**
 * Resolve a valid absolute URL for project-level public metadata.
 *
 * Priority:
 * 1) PROJECT_URL (as-is if already absolute, otherwise assume https://)
 * 2) VERCEL_URL (always https://)
 * 3) localhost development fallback
 */
export function getProjectBaseUrl() {
  const projectUrl = process.env.PROJECT_URL?.trim();

  if (projectUrl) {
    try {
      return new URL(projectUrl);
    } catch {
      return new URL(`https://${projectUrl}`);
    }
  }

  return new URL(
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000",
  );
}
