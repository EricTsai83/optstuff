import { and, eq, isNull } from "drizzle-orm";

import { RATE_LIMITS } from "@/lib/constants";
import { db } from "@/server/db";
import { apiKeys, projects, teams } from "@/server/db/schema";
import { decryptApiKey } from "@/server/lib/api-key";
import { getRedis } from "@/server/lib/redis";

/**
 * Project configuration type for IPX service
 */
export type ProjectConfig = {
  readonly id: string;
  readonly slug: string;
  readonly teamId: string;
  readonly allowedRefererDomains: string[] | null;
};

/**
 * API Key configuration type for IPX service
 */
export type ApiKeyConfig = {
  readonly id: string;
  readonly keyPrefix: string;
  readonly secretKey: string;
  readonly projectId: string;
  readonly allowedSourceDomains: readonly string[] | null;
  readonly expiresAt: Date | null;
  readonly revokedAt: Date | null;
  readonly rateLimitPerMinute: number;
  readonly rateLimitPerDay: number;
};

/**
 * Serialized version of {@link ApiKeyConfig} for Redis storage.
 * Date fields are stored as ISO strings since JSON does not support Date.
 */
type CachedApiKeyConfig = Omit<ApiKeyConfig, "expiresAt" | "revokedAt"> & {
  readonly expiresAt: string | null;
  readonly revokedAt: string | null;
};

/**
 * Convert a cached API key config (with ISO string dates) back to {@link ApiKeyConfig}.
 */
function parseApiKeyFromCache(cached: CachedApiKeyConfig): ApiKeyConfig {
  return {
    ...cached,
    expiresAt: cached.expiresAt ? new Date(cached.expiresAt) : null,
    revokedAt: cached.revokedAt ? new Date(cached.revokedAt) : null,
  };
}

/**
 * Prepare an {@link ApiKeyConfig} for Redis storage by converting Date fields to ISO strings.
 */
function serializeApiKeyForCache(config: ApiKeyConfig): CachedApiKeyConfig {
  return {
    ...config,
    expiresAt: config.expiresAt ? config.expiresAt.toISOString() : null,
    revokedAt: config.revokedAt ? config.revokedAt.toISOString() : null,
  };
}

/** Redis cache key prefixes */
const PROJECT_KEY_PREFIX = "cache:project:slug";
const PROJECT_TEAM_KEY_PREFIX = "cache:project:team-slug";
const API_KEY_PREFIX = "cache:apikey:prefix";

/**
 * Cache TTL in seconds (60 seconds).
 * Changes in dashboard will take effect within this time.
 */
const CACHE_TTL_SECONDS = 60;

/**
 * Negative cache TTL in seconds (10 seconds).
 * Caches "not found" results with a shorter TTL to absorb repeated
 * lookups for non-existent slugs or key prefixes (e.g. probing attacks),
 * while still allowing newly created resources to become visible quickly.
 */
const NEGATIVE_CACHE_TTL_SECONDS = 10;

/**
 * Sentinel value stored in Redis to represent a cached "not found" result.
 * Must be distinguishable from any valid config object.
 */
const NOT_FOUND_SENTINEL = "__NOT_FOUND__" as const;

/**
 * Get project configuration by slug with Redis caching.
 *
 * @param slug - Project slug (unique per team, but we use global slug for API)
 * @returns Project configuration or null if not found
 */
export async function getProjectConfig(
  slug: string,
): Promise<ProjectConfig | null> {
  const redis = getRedis();
  const cacheKey = `${PROJECT_KEY_PREFIX}:${slug}`;

  // Check Redis cache first
  const cached = await redis.get<ProjectConfig | typeof NOT_FOUND_SENTINEL>(
    cacheKey,
  );
  if (cached === NOT_FOUND_SENTINEL) {
    return null;
  }
  if (cached) {
    return cached;
  }

  // Query database
  const project = await db.query.projects.findFirst({
    where: eq(projects.slug, slug),
    with: { team: true },
  });

  if (!project) {
    // Negative cache: store sentinel with shorter TTL to absorb repeated misses
    await redis.set(cacheKey, NOT_FOUND_SENTINEL, {
      ex: NEGATIVE_CACHE_TTL_SECONDS,
    });
    return null;
  }

  const config: ProjectConfig = {
    id: project.id,
    slug: project.slug,
    teamId: project.teamId,
    allowedRefererDomains: project.allowedRefererDomains,
  };

  // Store in Redis with TTL
  await redis.set(cacheKey, config, { ex: CACHE_TTL_SECONDS });

  return config;
}

/**
 * Get project configuration by team slug and project slug with Redis caching.
 *
 * @param teamSlug - Team slug
 * @param projectSlug - Project slug
 * @returns Project configuration or null if not found
 */
export async function getProjectConfigByTeamAndSlug(
  teamSlug: string,
  projectSlug: string,
): Promise<ProjectConfig | null> {
  const redis = getRedis();
  const cacheKey = `${PROJECT_TEAM_KEY_PREFIX}:${teamSlug}/${projectSlug}`;

  // Check Redis cache first
  const cached = await redis.get<ProjectConfig | typeof NOT_FOUND_SENTINEL>(
    cacheKey,
  );
  if (cached === NOT_FOUND_SENTINEL) {
    return null;
  }
  if (cached) {
    return cached;
  }

  // Find team first
  const team = await db.query.teams.findFirst({
    where: eq(teams.slug, teamSlug),
  });

  if (!team) {
    // Negative cache: store sentinel with shorter TTL to absorb repeated misses
    await redis.set(cacheKey, NOT_FOUND_SENTINEL, {
      ex: NEGATIVE_CACHE_TTL_SECONDS,
    });
    return null;
  }

  // Find project within team
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.teamId, team.id), eq(projects.slug, projectSlug)),
  });

  if (!project) {
    // Negative cache: store sentinel with shorter TTL to absorb repeated misses
    await redis.set(cacheKey, NOT_FOUND_SENTINEL, {
      ex: NEGATIVE_CACHE_TTL_SECONDS,
    });
    return null;
  }

  const config: ProjectConfig = {
    id: project.id,
    slug: project.slug,
    teamId: project.teamId,
    allowedRefererDomains: project.allowedRefererDomains,
  };

  // Store in Redis with TTL
  await redis.set(cacheKey, config, { ex: CACHE_TTL_SECONDS });

  return config;
}

/**
 * Get API key configuration by key prefix with Redis caching.
 *
 * @param keyPrefix - The key prefix (e.g., "pk_abc123...")
 * @returns API key configuration or null if not found/invalid
 */
export async function getApiKeyConfig(
  keyPrefix: string,
): Promise<ApiKeyConfig | null> {
  const redis = getRedis();
  const cacheKey = `${API_KEY_PREFIX}:${keyPrefix}`;

  // Check Redis cache first
  const cached = await redis.get<
    CachedApiKeyConfig | typeof NOT_FOUND_SENTINEL
  >(cacheKey);
  if (cached === NOT_FOUND_SENTINEL) {
    return null;
  }
  if (cached) {
    return parseApiKeyFromCache(cached);
  }

  // Query database
  const apiKey = await db.query.apiKeys.findFirst({
    where: and(eq(apiKeys.keyPrefix, keyPrefix), isNull(apiKeys.revokedAt)),
  });

  if (!apiKey) {
    // Negative cache: store sentinel with shorter TTL to absorb repeated misses
    await redis.set(cacheKey, NOT_FOUND_SENTINEL, {
      ex: NEGATIVE_CACHE_TTL_SECONDS,
    });
    return null;
  }

  const config: ApiKeyConfig = {
    id: apiKey.id,
    keyPrefix: apiKey.keyPrefix,
    secretKey: decryptApiKey(apiKey.secretKey),
    projectId: apiKey.projectId,
    allowedSourceDomains: apiKey.allowedSourceDomains,
    expiresAt: apiKey.expiresAt,
    revokedAt: apiKey.revokedAt,
    rateLimitPerMinute: apiKey.rateLimitPerMinute ?? RATE_LIMITS.perMinute,
    rateLimitPerDay: apiKey.rateLimitPerDay ?? RATE_LIMITS.perDay,
  };

  // Store serialized version in Redis with TTL
  await redis.set(cacheKey, serializeApiKeyForCache(config), {
    ex: CACHE_TTL_SECONDS,
  });

  return config;
}

/**
 * Invalidate cache for a specific project.
 * Deletes both the slug-keyed entry and any team+slug entries for this slug.
 *
 * @param slug - Project slug to invalidate
 */
export async function invalidateProjectCache(slug: string): Promise<void> {
  const redis = getRedis();

  // Delete the direct slug key
  const keysToDelete: string[] = [`${PROJECT_KEY_PREFIX}:${slug}`];

  // Scan for any team+slug combo keys ending with this slug
  let cursor = "0";
  do {
    const result = await redis.scan(cursor, {
      match: `${PROJECT_TEAM_KEY_PREFIX}:*/${slug}`,
      count: 100,
    });
    cursor = result[0];
    keysToDelete.push(...result[1]);
  } while (cursor !== "0");

  if (keysToDelete.length > 0) {
    await redis.del(...keysToDelete);
  }
}

/**
 * Invalidate cache for a specific API key.
 *
 * @param keyPrefix - API key prefix to invalidate
 */
export async function invalidateApiKeyCache(keyPrefix: string): Promise<void> {
  const redis = getRedis();
  await redis.del(`${API_KEY_PREFIX}:${keyPrefix}`);
}

/**
 * Clear all cached project configurations.
 */
export async function clearProjectCache(): Promise<void> {
  const redis = getRedis();
  const keysToDelete: string[] = [];

  let cursor = "0";
  do {
    const result = await redis.scan(cursor, {
      match: `${PROJECT_KEY_PREFIX}:*`,
      count: 100,
    });
    cursor = result[0];
    keysToDelete.push(...result[1]);
  } while (cursor !== "0");

  // Also scan team+slug keys
  cursor = "0";
  do {
    const result = await redis.scan(cursor, {
      match: `${PROJECT_TEAM_KEY_PREFIX}:*`,
      count: 100,
    });
    cursor = result[0];
    keysToDelete.push(...result[1]);
  } while (cursor !== "0");

  if (keysToDelete.length > 0) {
    await redis.del(...keysToDelete);
  }
}

/**
 * Clear all cached API key configurations.
 */
export async function clearApiKeyCache(): Promise<void> {
  const redis = getRedis();
  const keysToDelete: string[] = [];

  let cursor = "0";
  do {
    const result = await redis.scan(cursor, {
      match: `${API_KEY_PREFIX}:*`,
      count: 100,
    });
    cursor = result[0];
    keysToDelete.push(...result[1]);
  } while (cursor !== "0");

  if (keysToDelete.length > 0) {
    await redis.del(...keysToDelete);
  }
}
