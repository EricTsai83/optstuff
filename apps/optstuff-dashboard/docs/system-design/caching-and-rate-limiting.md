# Caching & Rate Limiting Configuration Guide

This document describes every caching and rate limiting strategy used by the Image Optimization API, their default values, and how to change them.

For the underlying Redis design patterns and trade-off rationale, see [Redis Architecture](./redis-architecture.md).

---

## Table of Contents

- [Overview](#overview)
- [1. Configuration Cache](#1-configuration-cache)
- [2. Rate Limiting](#2-rate-limiting)
- [3. Write Throttling](#3-write-throttling)
- [Configuration Reference](#configuration-reference)
- [Tuning Recommendations](#tuning-recommendations)

---

## Overview

The Image Optimization API uses Redis for three purposes. Each has its own TTL, scope, and configuration method:

| Strategy | Purpose | Default | Configured In |
|----------|---------|---------|---------------|
| Config Cache | Avoid repeated DB reads for project/key lookups | 60s TTL | Code constant |
| Rate Limiting (per-minute) | Prevent burst abuse | 60 req/min | Per API key (DB) |
| Rate Limiting (per-day) | Prevent sustained abuse | 10,000 req/day | Per API key (DB) |
| Write Throttling | Reduce `lastUsedAt` / `lastActivityAt` DB writes | 30s interval | Code constant |

---

## 1. Configuration Cache

**File:** `src/server/lib/config-cache.ts`

### What Is Cached

Every image request requires two database lookups before processing can begin:

1. **ProjectConfig** — project ID, slug, team ID, allowed referer domains
2. **ApiKeyConfig** — key ID, decrypted secret key, allowed source domains, expiration, rate limits

Both are cached in Redis after the first lookup.

### TTL (Time-To-Live)

```text
Default: 60 seconds
```

Defined as a constant:

```typescript
const CACHE_TTL_SECONDS = 60;
```

**To change:** Edit the `CACHE_TTL_SECONDS` constant in `config-cache.ts` and redeploy.

### Cache Keys

| Data | Key Format | Example |
|------|------------|---------|
| Project (by slug) | `cache:project:slug:{slug}` | `cache:project:slug:my-blog` |
| Project (by team + slug) | `cache:project:team-slug:{teamSlug}/{projectSlug}` | `cache:project:team-slug:acme/my-blog` |
| API Key (by prefix) | `cache:apikey:prefix:{keyPrefix}` | `cache:apikey:prefix:pk_abc123` |

### Invalidation

Cache entries are removed in two ways:

1. **Automatic** — Redis evicts the key after TTL expires (60s).
2. **Manual (immediate)** — Dashboard mutations call invalidation functions:

| Dashboard Action | Invalidation Function | Effect |
|------------------|-----------------------|--------|
| Update project settings | `invalidateProjectCache(slug)` | Deletes all cache entries for that project slug |
| Revoke / update API key | `invalidateApiKeyCache(keyPrefix)` | Deletes the cache entry for that key prefix |

This means admin changes take effect **immediately** — the 60s TTL only matters if the invalidation call somehow fails.

### Negative Caching

Currently, `null` results (project not found / key not found) are **not cached**. Every request for a non-existent slug or key prefix will hit the database. This is intentional to avoid caching a "not found" that becomes stale when the resource is later created.

---

## 2. Rate Limiting

**File:** `src/server/lib/rate-limiter.ts`

### Algorithm

**Sliding Window** via `@upstash/ratelimit`.

Unlike fixed windows that reset at hard boundaries (allowing up to 2× burst), sliding windows weight the previous window's count by overlap percentage, producing a smooth limit with no boundary spikes.

### Dual-Layer Limits

Each API key is checked against two independent limits. Both must pass for the request to proceed.

| Layer | Default Limit | Window | Redis Key Prefix | Purpose |
|-------|---------------|--------|-------------------|---------|
| Per-minute | **60 requests** | 1 minute | `ratelimit:ipx:minute:` | Catch sudden bursts |
| Per-day | **10,000 requests** | 24 hours | `ratelimit:ipx:day:` | Catch sustained overuse |

The per-minute limit is checked **first** because it provides faster feedback to the caller.

### How Limits Are Configured

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

**To change limits for a specific API key:** Update the `rateLimitPerMinute` and/or `rateLimitPerDay` columns in the `apiKeys` table for that key. After updating, call `invalidateApiKeyCache(keyPrefix)` to flush the cached config so the new limits take effect immediately.

### Response When Rate Limited

When a request exceeds the limit, the API returns:

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

### Analytics

Rate limit instances are created with `analytics: true`, which sends usage metrics to the Upstash dashboard. You can view rate limit hit/miss statistics at [console.upstash.com](https://console.upstash.com).

---

## 3. Write Throttling

**File:** `src/server/lib/usage-tracker.ts`

### Problem

Every image request should update two timestamps in the database:

- `apiKeys.lastUsedAt` — when this API key was last used
- `projects.lastActivityAt` — when this project last had activity

Without throttling, an API key handling 60 req/min produces **120 UPDATE queries/min** (one for the key, one for the project, per request).

### Solution

A Redis `SET NX EX` lock ensures at most **one DB write per entity per interval**, regardless of how many requests or serverless instances are running.

### Throttle Interval

```text
Default: 30 seconds
```

Defined as a constant:

```typescript
const THROTTLE_SECONDS = 30;
```

**To change:** Edit the `THROTTLE_SECONDS` constant in `usage-tracker.ts` and redeploy.

### How It Works

```text
Request arrives → SET usage:apikey:{id} "1" NX EX 30
                   ├─ "OK" (first request in this 30s window) → UPDATE DB
                   └─ null  (another request already wrote)   → skip
```

| Redis Key Format | TTL | Example |
|------------------|-----|---------|
| `usage:apikey:{apiKeyId}` | 30s | `usage:apikey:clx1abc...` |
| `usage:project:{projectId}` | 30s | `usage:project:clx2def...` |

### Execution Model

Write throttling runs as **fire-and-forget** — it does not `await` the result and does not block the image response. Errors are caught and logged to `console.error` but never propagated to the caller.

### Precision vs. Performance

The `lastUsedAt` timestamp is displayed in the dashboard as "last used N minutes ago". A 30-second precision is more than sufficient for this UI, while reducing DB writes by up to **97%** under sustained load.

| Scenario (60 req/min) | Without Throttling | With Throttling (30s) |
|------------------------|--------------------|-----------------------|
| DB UPDATEs per minute (key) | 60 | 2 |
| DB UPDATEs per minute (project) | 60 | 2 |
| **Total UPDATEs per minute** | **120** | **4** |

---

## Configuration Reference

A quick-reference table of every tunable value:

| Setting | Default | Location | How to Change |
|---------|---------|----------|---------------|
| Config cache TTL | `60` seconds | `config-cache.ts` → `CACHE_TTL_SECONDS` | Edit constant, redeploy |
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
2. To apply immediately, call `invalidateApiKeyCache(keyPrefix)` after the DB update.
3. The tRPC routers (`apiKey.ts`) already do this automatically when updating keys via the dashboard.

If you update limits via a direct SQL query (not through the dashboard), you must invalidate manually or wait for the cache TTL to expire.
