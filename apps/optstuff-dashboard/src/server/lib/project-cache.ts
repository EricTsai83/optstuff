import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { projects, teams } from "@/server/db/schema";

/**
 * Project configuration type for IPX service
 */
export type ProjectConfig = {
  id: string;
  slug: string;
  teamId: string;
  allowedSourceDomains: string[] | null;
  allowedRefererDomains: string[] | null;
};

/**
 * Cache entry with expiration
 */
type CacheEntry = {
  project: ProjectConfig;
  expiresAt: number;
};

/**
 * In-memory cache for project configurations
 * Reduces database queries for frequently accessed projects
 */
const projectCache = new Map<string, CacheEntry>();

/**
 * Cache TTL in milliseconds (1 minute)
 * Changes in dashboard will take effect within this time
 */
const CACHE_TTL = 60 * 1000;

/**
 * Get project configuration by slug with caching
 *
 * @param slug - Project slug (unique per team, but we use global slug for API)
 * @returns Project configuration or null if not found
 */
export async function getProjectConfig(
  slug: string,
): Promise<ProjectConfig | null> {
  const now = Date.now();

  // Check cache first
  const cached = projectCache.get(slug);
  if (cached && cached.expiresAt > now) {
    return cached.project;
  }

  // Query database - need to find project by slug across all teams
  // Note: In a multi-tenant setup, you might want to use a globally unique project ID
  const project = await db.query.projects.findFirst({
    where: eq(projects.slug, slug),
    with: { team: true },
  });

  if (!project) {
    // Remove from cache if exists
    projectCache.delete(slug);
    return null;
  }

  const config: ProjectConfig = {
    id: project.id,
    slug: project.slug,
    teamId: project.teamId,
    allowedSourceDomains: project.allowedSourceDomains,
    allowedRefererDomains: project.allowedRefererDomains,
  };

  // Update cache
  projectCache.set(slug, {
    project: config,
    expiresAt: now + CACHE_TTL,
  });

  return config;
}

/**
 * Get project configuration by team slug and project slug
 *
 * @param teamSlug - Team slug
 * @param projectSlug - Project slug
 * @returns Project configuration or null if not found
 */
export async function getProjectConfigByTeamAndSlug(
  teamSlug: string,
  projectSlug: string,
): Promise<ProjectConfig | null> {
  const cacheKey = `${teamSlug}/${projectSlug}`;
  const now = Date.now();

  // Check cache first
  const cached = projectCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.project;
  }

  // Find team first
  const team = await db.query.teams.findFirst({
    where: eq(teams.slug, teamSlug),
  });

  if (!team) {
    return null;
  }

  // Find project within team
  const project = await db.query.projects.findFirst({
    where: eq(projects.slug, projectSlug),
  });

  if (!project || project.teamId !== team.id) {
    return null;
  }

  const config: ProjectConfig = {
    id: project.id,
    slug: project.slug,
    teamId: project.teamId,
    allowedSourceDomains: project.allowedSourceDomains,
    allowedRefererDomains: project.allowedRefererDomains,
  };

  // Update cache
  projectCache.set(cacheKey, {
    project: config,
    expiresAt: now + CACHE_TTL,
  });

  return config;
}

/**
 * Invalidate cache for a specific project
 *
 * @param slug - Project slug to invalidate
 */
export function invalidateProjectCache(slug: string): void {
  // Invalidate both possible cache keys
  projectCache.delete(slug);
  // Also clear any team/project combo keys that might include this slug
  for (const key of projectCache.keys()) {
    if (key.endsWith(`/${slug}`)) {
      projectCache.delete(key);
    }
  }
}

/**
 * Clear all cached project configurations
 */
export function clearProjectCache(): void {
  projectCache.clear();
}
