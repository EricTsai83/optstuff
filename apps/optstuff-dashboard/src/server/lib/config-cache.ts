import { and, eq } from "drizzle-orm";

import { RATE_LIMITS } from "@/lib/constants";
import { db } from "@/server/db";
import { apiKeys, projects, teams } from "@/server/db/schema";
import { decryptApiKey, DecryptApiKeyError } from "@/server/lib/api-key";
import { getRedis } from "@/server/lib/redis";

/**
 * Project configuration type for IPX service
 */
export type ProjectConfig = {
  readonly id: string;
  readonly slug: string;
  readonly teamId: string;
  readonly allowedRefererDomains: readonly string[] | null;
};

/**
 * API Key configuration type for IPX service
 */
export type ApiKeyConfig = {
  readonly id: string;
  readonly publicKey: string;
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
 * The secret key is stored in its **encrypted** form (never plaintext)
 * to prevent leaking secrets to Redis.
 * Date fields are stored as ISO strings since JSON does not support Date.
 */
type CachedApiKeyConfig = Omit<
  ApiKeyConfig,
  "secretKey" | "expiresAt" | "revokedAt"
> & {
  readonly encryptedSecretKey: string;
  readonly expiresAt: string | null;
  readonly revokedAt: string | null;
};

/**
 * Converts a cached API key record into an ApiKeyConfig.
 *
 * Decrypts the encrypted secret and transforms ISO date strings for `expiresAt` and `revokedAt` into `Date` objects.
 *
 * @returns The reconstructed `ApiKeyConfig`, or `null` if secret decryption fails (corrupted cache entry).
 */
function parseApiKeyFromCache(cached: CachedApiKeyConfig): ApiKeyConfig | null {
  const { encryptedSecretKey, expiresAt, revokedAt, ...rest } = cached;
  const decryptResult = decryptApiKey(encryptedSecretKey);

  if (!decryptResult.ok) {
    console.warn(
      `Failed to decrypt cached API key ${cached.publicKey}:`,
      decryptResult.error.message,
    );
    return null;
  }

  return {
    ...rest,
    secretKey: decryptResult.value,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    revokedAt: revokedAt ? new Date(revokedAt) : null,
  };
}

/**
 * Prepare API key data from a DB row for Redis storage.
 * Stores the secret key in its encrypted form (from DB) and converts Date fields to ISO strings.
 */
function serializeApiKeyForCache(apiKeyRow: {
  readonly id: string;
  readonly publicKey: string;
  readonly secretKey: string;
  readonly projectId: string;
  readonly allowedSourceDomains: string[] | null;
  readonly expiresAt: Date | null;
  readonly revokedAt: Date | null;
  readonly rateLimitPerMinute: number | null;
  readonly rateLimitPerDay: number | null;
}): CachedApiKeyConfig {
  return {
    id: apiKeyRow.id,
    publicKey: apiKeyRow.publicKey,
    encryptedSecretKey: apiKeyRow.secretKey,
    projectId: apiKeyRow.projectId,
    allowedSourceDomains: apiKeyRow.allowedSourceDomains,
    expiresAt: apiKeyRow.expiresAt ? apiKeyRow.expiresAt.toISOString() : null,
    revokedAt: apiKeyRow.revokedAt ? apiKeyRow.revokedAt.toISOString() : null,
    rateLimitPerMinute:
      apiKeyRow.rateLimitPerMinute ?? RATE_LIMITS.perMinute,
    rateLimitPerDay: apiKeyRow.rateLimitPerDay ?? RATE_LIMITS.perDay,
  };
}

/** Redis cache key prefixes */
const PROJECT_KEY_PREFIX = "cache:project:slug";
const PROJECT_ID_KEY_PREFIX = "cache:project:id";
const PROJECT_TEAM_KEY_PREFIX = "cache:project:team-slug";
const API_KEY_PREFIX = "cache:apikey:pk";

/**
 * Cache TTL in seconds (60 seconds).
 * Changes in dashboard will take effect within this time.
 */
const CACHE_TTL_SECONDS = 60;

/**
 * Negative cache TTL in seconds (10 seconds).
 * Caches "not found" results with a shorter TTL to absorb repeated
 * lookups for non-existent slugs or public keys (e.g. probing attacks),
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
 * Degrades gracefully when Redis is unreachable — falls back to direct DB query.
 *
 * @param slug - Project slug (unique per team, but we use global slug for API)
 * @returns Project configuration or null if not found
 */
export async function getProjectConfig(
  slug: string,
): Promise<ProjectConfig | null> {
  const redis = getRedis();
  const cacheKey = `${PROJECT_KEY_PREFIX}:${slug}`;

  // Check Redis cache first (skip on Redis failure)
  try {
    const cached = await redis.get<ProjectConfig | typeof NOT_FOUND_SENTINEL>(
      cacheKey,
    );
    if (cached === NOT_FOUND_SENTINEL) {
      return null;
    }
    if (cached) {
      return cached;
    }
  } catch (error) {
    console.warn("Redis read failed for project config, falling back to DB:", error);
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
    }).catch((error: unknown) => {
      console.warn("Redis write failed for negative cache:", error);
    });
    return null;
  }

  const config: ProjectConfig = {
    id: project.id,
    slug: project.slug,
    teamId: project.teamId,
    allowedRefererDomains: project.allowedRefererDomains,
  };

  // Store in Redis with TTL (best-effort)
  await redis.set(cacheKey, config, { ex: CACHE_TTL_SECONDS }).catch(
    (error: unknown) => {
      console.warn("Redis write failed for project config cache:", error);
    },
  );

  return config;
}

/**
 * Get project configuration by project ID with Redis caching.
 * Unlike {@link getProjectConfig}, this uses the unique project ID
 * so it is immune to slug collisions across teams.
 *
 * Degrades gracefully when Redis is unreachable — falls back to direct DB query.
 *
 * @param projectId - Project UUID
 * @returns Project configuration or null if not found
 */
export async function getProjectConfigById(
  projectId: string,
): Promise<ProjectConfig | null> {
  const redis = getRedis();
  const cacheKey = `${PROJECT_ID_KEY_PREFIX}:${projectId}`;

  // Check Redis cache first (skip on Redis failure)
  try {
    const cached = await redis.get<ProjectConfig | typeof NOT_FOUND_SENTINEL>(
      cacheKey,
    );
    if (cached === NOT_FOUND_SENTINEL) {
      return null;
    }
    if (cached) {
      return cached;
    }
  } catch (error) {
    console.warn("Redis read failed for project config by ID, falling back to DB:", error);
  }

  // Query database by primary key
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });

  if (!project) {
    // Negative cache: store sentinel with shorter TTL to absorb repeated misses
    await redis.set(cacheKey, NOT_FOUND_SENTINEL, {
      ex: NEGATIVE_CACHE_TTL_SECONDS,
    }).catch((error: unknown) => {
      console.warn("Redis write failed for negative cache:", error);
    });
    return null;
  }

  const config: ProjectConfig = {
    id: project.id,
    slug: project.slug,
    teamId: project.teamId,
    allowedRefererDomains: project.allowedRefererDomains,
  };

  // Store in Redis with TTL (best-effort)
  await redis.set(cacheKey, config, { ex: CACHE_TTL_SECONDS }).catch(
    (error: unknown) => {
      console.warn("Redis write failed for project config by ID cache:", error);
    },
  );

  return config;
}

/**
 * Get project configuration by team slug and project slug with Redis caching.
 * Degrades gracefully when Redis is unreachable — falls back to direct DB query.
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

  // Check Redis cache first (skip on Redis failure)
  try {
    const cached = await redis.get<ProjectConfig | typeof NOT_FOUND_SENTINEL>(
      cacheKey,
    );
    if (cached === NOT_FOUND_SENTINEL) {
      return null;
    }
    if (cached) {
      return cached;
    }
  } catch (error) {
    console.warn("Redis read failed for team+project config, falling back to DB:", error);
  }

  // Find team first
  const team = await db.query.teams.findFirst({
    where: eq(teams.slug, teamSlug),
  });

  if (!team) {
    // Negative cache: store sentinel with shorter TTL to absorb repeated misses
    await redis.set(cacheKey, NOT_FOUND_SENTINEL, {
      ex: NEGATIVE_CACHE_TTL_SECONDS,
    }).catch((error: unknown) => {
      console.warn("Redis write failed for negative cache:", error);
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
    }).catch((error: unknown) => {
      console.warn("Redis write failed for negative cache:", error);
    });
    return null;
  }

  const config: ProjectConfig = {
    id: project.id,
    slug: project.slug,
    teamId: project.teamId,
    allowedRefererDomains: project.allowedRefererDomains,
  };

  // Store in Redis with TTL (best-effort)
  await redis.set(cacheKey, config, { ex: CACHE_TTL_SECONDS }).catch(
    (error: unknown) => {
      console.warn("Redis write failed for team+project config cache:", error);
    },
  );

  return config;
}

/**
 * Retrieve the API key configuration for a given public key, using Redis for caching.
 *
 * If Redis is unavailable or a cached entry is corrupted (cannot be decrypted), the function falls back to a direct database lookup.
 *
 * @param publicKey - The public API key (for example, "pk_abc123...")
 * @returns The API key configuration for `publicKey`, or `null` if not found or if cached data cannot be decrypted
 */
export async function getApiKeyConfig(
  publicKey: string,
): Promise<ApiKeyConfig | null> {
  const redis = getRedis();
  const cacheKey = `${API_KEY_PREFIX}:${publicKey}`;

  // Check Redis cache first (skip on Redis failure)
  try {
    const cached = await redis.get<
      CachedApiKeyConfig | typeof NOT_FOUND_SENTINEL
    >(cacheKey);
    if (cached === NOT_FOUND_SENTINEL) {
      return null;
    }
    if (cached) {
      const parsed = parseApiKeyFromCache(cached);
      if (parsed) {
        return parsed;
      }
      // Decryption failed — corrupted cache entry. Invalidate and fall through to DB.
      await redis.del(cacheKey).catch(() => {});
    }
  } catch (error) {
    console.warn("Redis read failed for API key config, falling back to DB:", error);
  }

  // Query database — intentionally does NOT filter out revoked keys so that
  // the revokedAt timestamp is cached and the defense-in-depth check in
  // route.ts can reject stale cached entries that were revoked after caching.
  const apiKey = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.publicKey, publicKey),
  });

  if (!apiKey) {
    // Negative cache: store sentinel with shorter TTL to absorb repeated misses
    await redis.set(cacheKey, NOT_FOUND_SENTINEL, {
      ex: NEGATIVE_CACHE_TTL_SECONDS,
    }).catch((error: unknown) => {
      console.warn("Redis write failed for negative cache:", error);
    });
    return null;
  }

  // Serialize for cache — stores secret in encrypted form, never plaintext
  const cachedConfig = serializeApiKeyForCache(apiKey);

  // Store in Redis with TTL (best-effort)
  await redis.set(cacheKey, cachedConfig, {
    ex: CACHE_TTL_SECONDS,
  }).catch((error: unknown) => {
    console.warn("Redis write failed for API key config cache:", error);
  });

  // Decrypt secret key only when returning to the caller.
  // Unlike the cache-hit path (which falls through to DB on failure),
  // a decryption failure here indicates a server-side issue (e.g. wrong
  // API_KEY_ENCRYPTION_SECRET or corrupted DB data) — surface it as an
  // error so the route handler returns 500, not a misleading 401.
  const parsed = parseApiKeyFromCache(cachedConfig);
  if (!parsed) {
    throw new Error(
      `API key decryption failed for public key "${publicKey}" after DB fetch`,
    );
  }

  return parsed;
}

/**
 * Invalidate cache for a specific project.
 * Deletes the slug-keyed entry, ID-keyed entry, and any team+slug entries for this slug.
 *
 * @param slug - Project slug to invalidate
 * @param projectId - Optional project ID to also invalidate the ID-keyed cache
 */
export async function invalidateProjectCache(
  slug: string,
  projectId?: string,
): Promise<void> {
  const redis = getRedis();

  // Delete the direct slug key
  const keysToDelete: string[] = [`${PROJECT_KEY_PREFIX}:${slug}`];

  // Delete ID-keyed cache if provided
  if (projectId) {
    keysToDelete.push(`${PROJECT_ID_KEY_PREFIX}:${projectId}`);
  }

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
 * @param publicKey - Public key to invalidate
 */
export async function invalidateApiKeyCache(publicKey: string): Promise<void> {
  const redis = getRedis();
  await redis.del(`${API_KEY_PREFIX}:${publicKey}`);
}

/**
 * Clear all cached project configurations.
 */
export async function clearProjectCache(): Promise<void> {
  const redis = getRedis();
  const keysToDelete: string[] = [];

  // Scan slug-keyed entries
  let cursor = "0";
  do {
    const result = await redis.scan(cursor, {
      match: `${PROJECT_KEY_PREFIX}:*`,
      count: 100,
    });
    cursor = result[0];
    keysToDelete.push(...result[1]);
  } while (cursor !== "0");

  // Scan ID-keyed entries
  cursor = "0";
  do {
    const result = await redis.scan(cursor, {
      match: `${PROJECT_ID_KEY_PREFIX}:*`,
      count: 100,
    });
    cursor = result[0];
    keysToDelete.push(...result[1]);
  } while (cursor !== "0");

  // Scan team+slug keys
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