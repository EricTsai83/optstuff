import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/server/db";
import { apiKeys, projects, teams } from "@/server/db/schema";

/**
 * Project configuration type for IPX service
 */
export type ProjectConfig = {
  id: string;
  slug: string;
  teamId: string;
  allowedRefererDomains: string[] | null;
};

/**
 * API Key configuration type for IPX service
 */
export type ApiKeyConfig = {
  id: string;
  keyPrefix: string;
  secretKey: string;
  projectId: string;
  allowedSourceDomains: string[] | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
};

/**
 * Cache entry with expiration
 */
type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

/**
 * In-memory cache for project configurations
 * Reduces database queries for frequently accessed projects
 */
const projectCache = new Map<string, CacheEntry<ProjectConfig>>();

/**
 * In-memory cache for API key configurations
 * Keyed by keyPrefix for fast lookup during signature verification
 */
const apiKeyCache = new Map<string, CacheEntry<ApiKeyConfig>>();

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
    return cached.data;
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
    allowedRefererDomains: project.allowedRefererDomains,
  };

  // Update cache
  projectCache.set(slug, {
    data: config,
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
    return cached.data;
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
    allowedRefererDomains: project.allowedRefererDomains,
  };

  // Update cache
  projectCache.set(cacheKey, {
    data: config,
    expiresAt: now + CACHE_TTL,
  });

  return config;
}

/**
 * Get API key configuration by key prefix with caching
 *
 * @param keyPrefix - The key prefix (e.g., "pk_abc123...")
 * @returns API key configuration or null if not found/invalid
 */
export async function getApiKeyConfig(
  keyPrefix: string,
): Promise<ApiKeyConfig | null> {
  const now = Date.now();

  // Check cache first
  const cached = apiKeyCache.get(keyPrefix);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  // Query database
  const apiKey = await db.query.apiKeys.findFirst({
    where: and(eq(apiKeys.keyPrefix, keyPrefix), isNull(apiKeys.revokedAt)),
  });

  if (!apiKey) {
    // Remove from cache if exists
    apiKeyCache.delete(keyPrefix);
    return null;
  }

  const config: ApiKeyConfig = {
    id: apiKey.id,
    keyPrefix: apiKey.keyPrefix,
    secretKey: apiKey.secretKey,
    projectId: apiKey.projectId,
    allowedSourceDomains: apiKey.allowedSourceDomains,
    expiresAt: apiKey.expiresAt,
    revokedAt: apiKey.revokedAt,
  };

  // Update cache
  apiKeyCache.set(keyPrefix, {
    data: config,
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
 * Invalidate cache for a specific API key
 *
 * @param keyPrefix - API key prefix to invalidate
 */
export function invalidateApiKeyCache(keyPrefix: string): void {
  apiKeyCache.delete(keyPrefix);
}

/**
 * Clear all cached project configurations
 */
export function clearProjectCache(): void {
  projectCache.clear();
}

/**
 * Clear all cached API key configurations
 */
export function clearApiKeyCache(): void {
  apiKeyCache.clear();
}
