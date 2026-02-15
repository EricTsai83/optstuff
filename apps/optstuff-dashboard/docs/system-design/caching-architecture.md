# Caching Architecture

This document describes every caching layer in the OptStuff image optimization service — from browser and CDN caching to server-side Redis patterns — their design rationale, default values, and how to change them.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Layer 1: HTTP Caching (Browser & CDN)](#layer-1-http-caching-browser--cdn)
- [Layer 2: Redis Configuration Cache](#layer-2-redis-configuration-cache)
- [Layer 3: Redis Rate Limiting](#layer-3-redis-rate-limiting)
- [Layer 4: Redis Write Throttling](#layer-4-redis-write-throttling)
- [Redis Key Schema](#redis-key-schema)
- [Data Durability](#data-durability)
- [Failure Modes](#failure-modes)
- [Configuration Reference](#configuration-reference)
- [Tuning Recommendations](#tuning-recommendations)

---

## Architecture Overview

The system employs a multi-layer caching strategy. Each layer targets a different bottleneck:

```text
Client requests optimized image
     │
     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Layer 1: HTTP Caching (Browser & CDN)                                      │
│                                                                             │
│  Cache-Control: public, max-age=31536000, immutable                         │
│  → Browser serves from disk cache instantly (0ms)                           │
│  → CDN edge serves cached response (~10ms)                                  │
│  → Eliminates redundant requests to origin                                  │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │ Cache miss
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Layer 2: Redis Configuration Cache                                          │
│                                                                             │
│  Pattern: Cache-Aside (Lazy Population)                                     │
│  → Caches ProjectConfig and ApiKeyConfig (TTL 60s)                            │
│  → Avoids DB reads on every image request                                   │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │ Config loaded
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Layer 3: Redis Rate Limiting                                               │
│                                                                             │
│  Pattern: Sliding Window Counter (@upstash/ratelimit)                       │
│  → Per-day (10K) + Per-minute (60) dual-layer limits                        │
│  → Global accuracy across serverless instances                              │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │ Request allowed
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Image Processing (IPX/Sharp)                                               │
│  → Fetch source, apply transforms, return optimized image                   │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │ Response sent
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Layer 4: Redis Write Throttling (fire-and-forget)                           │
│                                                                             │
│  Pattern: Distributed Lock via SET NX EX                                    │
│  → Throttles lastUsedAt / lastActivityAt DB writes (30s interval)           │
│  → Reduces DB UPDATEs by ~97%                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Layer | Purpose | Technology | Latency Saved |
|-------|---------|------------|---------------|
| HTTP Caching | Avoid hitting origin server entirely | Cache-Control headers | ~50–500ms |
| Config Cache | Avoid DB reads for project/key lookups | Upstash Redis | ~10–40ms |
| Rate Limiting | Prevent API abuse across all instances | Upstash Redis | N/A (enforcement) |
| Write Throttling | Reduce DB write pressure | Upstash Redis | N/A (background) |

All Redis data is **ephemeral and rebuildable**. PostgreSQL remains the sole source of truth.

---

## Layer 1: HTTP Caching (Browser & CDN)

**File:** `src/app/api/v1/[projectSlug]/[...path]/route.ts`

HTTP caching is the outermost layer — it prevents requests from ever reaching the server. When a browser or CDN has a cached copy of an optimized image, it serves it directly without contacting the origin.

### Current Response Headers

```typescript
return new Response(imageData, {
  status: 200,
  headers: {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Processing-Time": `${processingTimeMs}ms`,
  },
});
```

### Cache-Control Directives

| Directive | Meaning |
|-----------|---------|
| `public` | Any cache (browser, CDN, proxy) may store this response |
| `max-age=31536000` | Cache is valid for **1 year** (365 × 86,400 seconds) |
| `immutable` | Content will **never change** — browser should not revalidate even on hard refresh |

### Why This Strategy Works

Image optimization URLs are **content-addressable**: the same URL always produces the same output because the URL encodes the source image, all transformation parameters, and a cryptographic signature. Changing any parameter produces a different URL and therefore a different cache entry.

This makes aggressive caching safe — there is no risk of serving stale content because the URL itself changes when the content changes.

### CDN Behavior

When deployed behind a CDN (e.g. Vercel Edge Network, Cloudflare):

```text
First request for /api/v1/my-blog/w_800,f_webp/cdn.example.com/photo.jpg?key=pk_abc&sig=xyz
  → CDN cache MISS → request reaches origin → origin processes image → CDN stores response

Second request (same URL)
  → CDN cache HIT → served from edge (~10ms) → origin never contacted
```

The `public` directive is critical here — without it, CDNs with default configurations may not cache the response.

### ETag (Not Currently Implemented)

The system overview diagram mentions ETag as part of the cache layer. ETag enables **conditional requests**: on cache expiry, the browser sends `If-None-Match: "{etag}"` and the server can respond with `304 Not Modified` (a few bytes) instead of re-sending the full image.

However, because `immutable` is set, browsers will not send conditional requests during the 1-year `max-age` window. ETag would only matter if:

1. The `max-age` is reduced to a shorter duration
2. A CDN strips the `immutable` directive
3. A client does not support `immutable` (rare in modern browsers)

For now, the `immutable` directive makes ETag unnecessary for most scenarios. It may be added in the future as a defense-in-depth measure.

---

## Layer 2: Redis Configuration Cache

**File:** `src/server/lib/config-cache.ts`
**Pattern:** Cache-Aside (Lazy Population)

### What Is Cached

Every image request requires two database lookups before processing can begin:

1. **ProjectConfig** — project ID, slug, team ID, allowed referer domains
2. **ApiKeyConfig** — key ID, secret key (stored encrypted in cache, decrypted on read), allowed source domains, expiration, revocation status, rate limits

Both are cached in Redis after the first lookup.

### How It Works

```text
getProjectConfigById("uuid-123")          ← used by API route (lookup by API key's projectId)
│
├─ Redis GET cache:project:id:uuid-123
│  ├─ HIT (config)       → return cached config
│  ├─ HIT (__NOT_FOUND__) → return null (negative cache hit)
│  └─ MISS → SELECT from PostgreSQL WHERE id = ?
│            ├─ not found → Redis SET __NOT_FOUND__ (EX 10s) → return null
│            └─ found     → Redis SET config (EX 60s) → return config

getApiKeyConfig("pk_abc123")              ← used by API route
│
├─ Redis GET cache:apikey:pk:pk_abc123
│  ├─ HIT (cached config) → decrypt secretKey → return ApiKeyConfig
│  ├─ HIT (__NOT_FOUND__)  → return null (negative cache hit)
│  └─ MISS → SELECT from PostgreSQL WHERE publicKey = ?
│            ├─ not found → Redis SET __NOT_FOUND__ (EX 10s) → return null
│            └─ found     → Redis SET config with encrypted secret (EX 60s)
│                          → decrypt secretKey → return ApiKeyConfig
```

On dashboard mutations (e.g. revoking an API key or updating project settings), the tRPC handler calls `invalidateProjectCache()` or `invalidateApiKeyCache()` to immediately delete the relevant Redis keys. This provides **instant consistency for admin operations** while the TTL acts as a safety net for edge cases.

### TTL (Time-To-Live)

```text
Positive cache:  60 seconds (CACHE_TTL_SECONDS)
Negative cache:  10 seconds (NEGATIVE_CACHE_TTL_SECONDS)
```

A shorter TTL gives fresher data but more DB queries. A longer TTL gives better hit rates but delays propagation of changes. 60 seconds balances both — admin operations bypass this via active invalidation, so the TTL only matters for the rare case where invalidation fails.

### Cache Keys

| Data | Key Format | Example |
|------|------------|---------|
| Project (by ID) | `cache:project:id:{projectId}` | `cache:project:id:uuid-123` |
| Project (by slug) | `cache:project:slug:{slug}` | `cache:project:slug:my-blog` |
| Project (by team + slug) | `cache:project:team-slug:{teamSlug}/{projectSlug}` | `cache:project:team-slug:acme/my-blog` |
| API Key (by public key) | `cache:apikey:pk:{publicKey}` | `cache:apikey:pk:pk_abc123` |

### Negative Caching

When a lookup returns no result (project not found / key not found), a sentinel value (`__NOT_FOUND__`) is cached with a **shorter TTL of 10 seconds**. This prevents repeated requests for non-existent slugs or public keys (e.g. probing attacks) from hitting the database on every request.

The shorter TTL ensures that when a resource is later created, it becomes visible within 10 seconds — much faster than the full 60-second positive cache TTL. Active invalidation also clears negative cache entries immediately.

### Invalidation

Cache entries are removed in two ways:

1. **Automatic** — Redis evicts the key after TTL expires.
2. **Manual (immediate)** — Dashboard mutations call invalidation functions:

| Dashboard Action | Invalidation Function | Effect |
|------------------|-----------------------|--------|
| Update project settings | `invalidateProjectCache(slug, projectId?)` | Deletes all cache entries for that project (slug, ID, team+slug) |
| Delete project | `invalidateProjectCache(slug, projectId?)` + invalidate all project API keys | Clears project and all associated key caches |
| Revoke / update API key | `invalidateApiKeyCache(publicKey)` | Deletes the cache entry for that public key |

Admin changes take effect **immediately** — the TTL only matters if the invalidation call somehow fails.

### Serialization and Secret Handling

`ApiKeyConfig` requires special handling for Redis storage:

- **Secret keys** are stored in their **encrypted form** (`encryptedSecretKey`) in Redis — never as plaintext — and are only decrypted via `decryptApiKey()` after retrieval from cache. This prevents leaking secrets to the Redis layer.
- **Date fields** (`expiresAt`, `revokedAt`) are stored as ISO 8601 strings since JSON has no native Date type, and converted back to `Date` objects on read.

A dedicated `CachedApiKeyConfig` type enforces both transformations at compile time.

**Why revoked keys are cached (not filtered out):** The database query in `getApiKeyConfig` deliberately does **not** filter by `revokedAt IS NULL`. This ensures that when the cache refreshes from the database, the `revokedAt` timestamp is present in the cached entry. The route handler then performs a defense-in-depth check: if `apiKey.revokedAt` is set, the request is rejected with `401`. Without this, the filter would cause revoked keys to return `null` from the DB — indistinguishable from a non-existent key — making the route handler's revocation check dead code. Active invalidation via `invalidateApiKeyCache` remains the primary revocation mechanism; caching `revokedAt` acts as a safety net for stale entries.

### Benefits

| Benefit | Detail |
|---------|--------|
| Lower DB load | Repeated lookups hit Redis (~1-5ms) instead of PostgreSQL (~10-40ms) |
| Cross-instance sharing | All serverless instances share one cache, unlike in-memory Maps that start empty on every cold start |
| Active invalidation | Dashboard changes take effect immediately via explicit key deletion, not just TTL expiry |
| Negative caching | Non-existent slugs/keys are cached with a shorter TTL (10s) to absorb probing attacks |
| Automatic cleanup | TTL handles eviction — no manual garbage collection needed |

---

## Layer 3: Redis Rate Limiting

**File:** `src/server/lib/rate-limiter.ts`
**Pattern:** Sliding Window Counter (via `@upstash/ratelimit`)

### What It Does

Enforces per-API-key request limits at two granularities: per-minute and per-day. All serverless instances share the same counters, making the limit globally accurate.

### Algorithm: Sliding Window

Unlike fixed windows that reset at hard boundaries (allowing up to 2× burst), sliding windows weight the previous window's count by overlap percentage, producing a smooth limit with no boundary spikes:

```text
Fixed Window (problem):
  Window 1 [11:00:00 - 11:01:00]    Window 2 [11:01:00 - 11:02:00]
              ... 0 req ... 59 req │ 60 req ...
                                   ↑
                            119 requests in ~1 second

Sliding Window (solution) at 11:01:15 (25% into current window):
  Previous window count = 42
  Current window count  = 18
  Weighted count = 42 × 0.75 + 18 = 49.5 → under limit, allowed
```

### Dual-Layer Design

Each API key is checked against two independent limits. Both must pass for the request to proceed.

| Layer | Default Limit | Window | Redis Key Prefix | Purpose |
|-------|---------------|--------|-------------------|---------|
| Per-day | **10,000 requests** | 24 hours | `ratelimit:ipx:day:` | Catch sustained overuse |
| Per-minute | **60 requests** | 1 minute | `ratelimit:ipx:minute:` | Catch sudden bursts |

The per-day limit is checked **first**. This is deliberate: Upstash's `.limit()` is a consume-and-check operation — it decrements the counter atomically before returning the result. If the minute limit were checked first, a successful minute check would consume a minute token; a subsequent day rejection would block the request, but the minute token is already spent. Checking the day limit first inverts the problem: if day fails, no minute token is consumed.

> **Note:** Upstash also provides a non-consuming `getRemaining()` method that can query remaining tokens without decrementing. This could be used as a pre-check to avoid any token waste, at the cost of an extra Redis round trip per request. The current order-swap approach avoids this overhead while eliminating the most impactful waste scenario.

### How It Works

```text
checkRateLimit({ publicKey: "pk_abc", limitPerMinute: 60, limitPerDay: 10000 })
│
├─ 1. Per-day check (wider window, checked first)
│     slidingWindow.limit("pk_abc")
│     └─ exceeded? → { allowed: false, reason: "day", retryAfter: Ns }
│
└─ 2. Per-minute check (stricter)
      slidingWindow.limit("pk_abc")
      └─ exceeded? → { allowed: false, reason: "minute", retryAfter: Ns }
```

### Configuration

Rate limits are **per API key**, stored in the database:

| Database Column | Type | Default (fallback) |
|-----------------|------|--------------------|
| `apiKeys.rateLimitPerMinute` | `integer \| null` | `60` |
| `apiKeys.rateLimitPerDay` | `integer \| null` | `10000` |

**To change the default fallback:** Edit the fallback values in `config-cache.ts`:

```typescript
rateLimitPerMinute: apiKey.rateLimitPerMinute ?? 60,    // ← change 60
rateLimitPerDay: apiKey.rateLimitPerDay ?? 10000,       // ← change 10000
```

**To change limits for a specific API key:** Update the `rateLimitPerMinute` and/or `rateLimitPerDay` columns in the `apiKeys` table. After updating, call `invalidateApiKeyCache(publicKey)` to flush the cached config so the new limits take effect immediately.

### Response When Rate Limited

```json
{
  "error": "Rate limit exceeded",
  "reason": "Too many requests per minute",
  "retryAfter": 12,
  "limit": 60
}
```

With HTTP headers:

```text
HTTP/1.1 429 Too Many Requests
Retry-After: 12
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
```

### Resetting Rate Limits

For testing or administrative purposes, use the `resetRateLimit` function:

```typescript
import { resetRateLimit } from "@/server/lib/rate-limiter";

await resetRateLimit("pk_abc123");
```

This clears the sliding window counters in Redis for the specified key prefix.

### Instance Lifecycle

`Ratelimit` instances are lightweight configuration objects — they hold a reference to the shared Redis client, the window algorithm, and a key prefix. They are stateless: all actual counters live in Redis. Instances are created inline per `checkRateLimit` call rather than cached in-memory, because the construction cost is negligible and avoiding module-level `Map` state simplifies the code for serverless environments where containers are recycled frequently.

### Analytics

Rate limit instances are created with `analytics: true`, which sends usage metrics to the Upstash dashboard. You can view rate limit hit/miss statistics at [console.upstash.com](https://console.upstash.com).

---

## Layer 4: Redis Write Throttling

**File:** `src/server/lib/usage-tracker.ts`
**Pattern:** Distributed Lock via SET NX (Set-If-Not-Exists)

### Problem

Every image request should update two timestamps in the database:

- `apiKeys.lastUsedAt` — when this API key was last used
- `projects.lastActivityAt` — when this project last had activity

Without throttling, an API key handling 60 req/min produces **120 UPDATE queries/min** (one for the key, one for the project, per request).

### Solution

A Redis `SET NX EX` lock ensures at most **one DB write per entity per interval**, regardless of how many requests or serverless instances are running.

### How It Works

```text
updateApiKeyLastUsed("apikey-uuid", "project-uuid")
│
├─ Redis SET usage:apikey:{id} "1" NX EX 30
│  ├─ "OK" (key didn't exist) → UPDATE apiKeys SET lastUsedAt = now()
│  └─ null  (key exists)      → skip DB write
│
├─ Redis SET usage:project:{id} "1" NX EX 30
│  ├─ "OK" (key didn't exist) → UPDATE projects SET lastActivityAt = now()
│  └─ null  (key exists)      → skip DB write
```

### Atomicity Guarantee

`SET key value NX EX 30` is atomic in Redis. Even if 10 serverless instances execute it simultaneously for the same key, exactly one succeeds:

```text
T=0:
  Instance A: SET usage:apikey:abc "1" NX EX 30 → "OK"    (writes DB)
  Instance B: SET usage:apikey:abc "1" NX EX 30 → null     (skips)
  Instance C: SET usage:apikey:abc "1" NX EX 30 → null     (skips)

T=30 (key expires):
  Instance D: SET usage:apikey:abc "1" NX EX 30 → "OK"    (writes DB)
```

### Why SET NX Instead of In-Memory Batching

A previous design used an in-memory `Map` with `setTimeout` to batch writes every 5 seconds. This fails in serverless because:

1. `setTimeout` does not fire if the container is recycled before the timer
2. Pending updates in the `Map` are permanently lost on container recycle
3. Multiple instances maintain separate Maps, limiting deduplication effectiveness

`SET NX EX` solves all three problems: it is a single atomic Redis command with no dependency on timers, container lifecycle, or instance-local state.

### Execution Model

Write throttling runs as **fire-and-forget** — it does not `await` the result and does not block the image response. Errors are caught and logged to `console.error` but never propagated to the caller.

### Precision vs. Performance

`lastUsedAt` is displayed in the dashboard as "last used N minutes ago". A 30-second precision is more than sufficient for this UI, while reducing DB writes by up to **97%** under sustained load:

| Scenario (60 req/min) | Without Throttling | With Throttling (30s) |
|------------------------|--------------------|-----------------------|
| DB UPDATEs per minute (key) | 60 | 2 |
| DB UPDATEs per minute (project) | 60 | 2 |
| **Total UPDATEs per minute** | **120** | **4** |

---

## Redis Key Schema

| Prefix | Purpose | TTL | Example |
|--------|---------|-----|---------|
| `cache:project:id:` | Project config cache (by ID) | 60s | `cache:project:id:uuid-123` |
| `cache:project:slug:` | Project config cache (by slug) | 60s | `cache:project:slug:my-blog` |
| `cache:project:team-slug:` | Team+Project config cache | 60s | `cache:project:team-slug:acme/my-blog` |
| `cache:apikey:pk:` | API key config cache | 60s | `cache:apikey:pk:pk_abc123` |
| `ratelimit:ipx:minute:` | Per-minute rate limit counter | ~60s | `ratelimit:ipx:minute:pk_abc123` |
| `ratelimit:ipx:day:` | Per-day rate limit counter | ~24h | `ratelimit:ipx:day:pk_abc123` |
| `usage:apikey:` | API key write throttle lock | 30s | `usage:apikey:uuid-123` |
| `usage:project:` | Project write throttle lock | 30s | `usage:project:uuid-456` |

All keys have a TTL. No key persists indefinitely.

---

## Data Durability

Redis contains **zero persistent data**. Every key falls into one of three categories:

| Category | Source of Truth | If Redis Is Wiped |
|----------|----------------|-------------------|
| Config cache | PostgreSQL | Next request refills from DB (higher latency for one request) |
| Rate limit counters | None (ephemeral by nature) | Counters reset to zero (briefly allows over-limit requests) |
| Write throttle locks | None (control flags) | Triggers one extra DB UPDATE per key (harmless) |

---

## Failure Modes

All Redis-dependent code paths degrade gracefully rather than hard-failing requests. The system treats Redis as an **optimisation layer**, not a core dependency.

| Scenario | Behaviour | Impact | Severity |
|----------|-----------|--------|----------|
| Redis temporarily unreachable | Config cache falls back to direct DB query; rate limiter fails open; usage tracker skips | Higher latency, no rate enforcement during outage | Medium |
| Redis data flushed | All caches miss; rate limits reset; throttle locks gone — system self-heals on next request | Brief burst of DB queries + briefly allows over-limit requests | Low |
| Redis instance deleted (e.g. 14-day inactivity on free tier) | Same as "temporarily unreachable" — every request falls back to DB | Sustained DB load increase, no rate protection | High |
| Redis latency spike | Request latency increases but still completes | Slower responses | Low |

### Fail-Open Design Rationale

The system intentionally **fails open** (allows requests through) rather than **fails closed** (rejects all requests) when Redis is unavailable:

- **Config cache** — The data is always available from PostgreSQL. Redis is purely a latency optimisation; falling back to DB adds ~10-40ms per request but keeps the service operational.
- **Rate limiting** — Rate limits protect against abuse, but a temporary loss of enforcement is less damaging than a full outage. A brief Redis disruption is not enough for meaningful abuse; prolonged outages surface via `console.warn` logs for operator alerting.
- **Usage tracking** — Already fire-and-forget by design. A missed `lastUsedAt` update is harmless and will self-correct on the next successful write cycle.

> **Note:** If your threat model requires fail-closed rate limiting (e.g. protecting a paid API with strict billing), you can change the `checkRateLimit` catch block to return `{ allowed: false, ... }` instead. The current fail-open default prioritises availability for an image optimisation CDN layer where brief unmetered access is acceptable.

---

## Configuration Reference

A quick-reference table of every tunable value:

| Setting | Default | Location | How to Change |
|---------|---------|----------|---------------|
| HTTP cache max-age | `31536000` (1 year) | `route.ts` → `Cache-Control` header | Edit header value, redeploy |
| Config cache TTL | `60` seconds | `config-cache.ts` → `CACHE_TTL_SECONDS` | Edit constant, redeploy |
| Negative cache TTL | `10` seconds | `config-cache.ts` → `NEGATIVE_CACHE_TTL_SECONDS` | Edit constant, redeploy |
| Rate limit per minute | `60` requests | `apiKeys.rateLimitPerMinute` (DB) | Update DB column per API key |
| Rate limit per day | `10,000` requests | `apiKeys.rateLimitPerDay` (DB) | Update DB column per API key |
| Rate limit default (minute) | `60` | `config-cache.ts` → fallback value | Edit fallback in `getApiKeyConfig`, redeploy |
| Rate limit default (day) | `10,000` | `config-cache.ts` → fallback value | Edit fallback in `getApiKeyConfig`, redeploy |
| Write throttle interval | `30` seconds | `usage-tracker.ts` → `THROTTLE_SECONDS` | Edit constant, redeploy |

### Environment Variables

Redis connectivity is configured via environment variables consumed by `@upstash/redis`:

| Variable | Description |
|----------|-------------|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |

These are read by `Redis.fromEnv()` in `src/server/lib/redis.ts`.

---

## Tuning Recommendations

### Low-Traffic Projects (< 100 req/day)

The defaults are well-suited for low-traffic use. No changes needed. Consider whether you need Redis at all — if cold start latency is acceptable, you could bypass caching and hit the database directly.

### Medium-Traffic Projects (100–10,000 req/day)

Defaults should work well. Monitor Upstash analytics to see if rate limits are being hit legitimately. If so, increase the per-day limit for affected API keys.

### High-Traffic Projects (> 10,000 req/day)

| Setting | Suggested Change | Reason |
|---------|-----------------|--------|
| `CACHE_TTL_SECONDS` | Increase to `120`–`300` | Fewer cache misses under heavy load |
| `THROTTLE_SECONDS` | Increase to `60` | Further reduces DB write pressure |
| Per-key rate limits | Set per key based on expected traffic | Avoid false 429s for legitimate heavy users |

### After Changing Database Rate Limits

When you update `rateLimitPerMinute` or `rateLimitPerDay` in the database:

1. The cached `ApiKeyConfig` still holds the **old** limits for up to 60 seconds.
2. To apply immediately, call `invalidateApiKeyCache(publicKey)` after the DB update.
3. The tRPC routers (`apiKey.ts`) already do this automatically when updating keys via the dashboard.

If you update limits via a direct SQL query (not through the dashboard), you must invalidate manually or wait for the cache TTL to expire.

---

## Related Documentation

| Document | Description |
|----------|-------------|
| [System Overview](./system-overview.md) | Full system architecture |
| [Access Control](./access-control.md) | Multi-layer permission model |
| [Security](../security-qa/security.md) | Security design and threat model |
