# Caching Architecture

This document describes how the OptStuff image optimization service caches responses — from browser and CDN caching to server-side caching and rate limiting — along with default values and how to change them.

For internal implementation details (Redis key schema, implementation patterns, serialization), see [Redis Schema](./redis-schema.md).

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Layer 1: HTTP Caching (Browser & CDN)](#layer-1-http-caching-browser--cdn)
- [Layer 2: Server-Side Configuration Cache](#layer-2-server-side-configuration-cache)
- [Layer 3: Rate Limiting](#layer-3-rate-limiting)
- [Layer 4: Write Throttling](#layer-4-write-throttling)
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
│  Cache-Control: public, s-maxage=31536000, max-age=31536000, immutable      │
│  → Browser serves from disk cache instantly (0ms)                           │
│  → CDN edge serves cached response (~10ms)                                  │
│  → Eliminates redundant requests to origin                                  │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │ Cache miss
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Layer 2: Server-Side Configuration Cache                                   │
│                                                                             │
│  → Caches project and API key configuration (TTL 60s)                       │
│  → Avoids database reads on every image request                             │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │ Config loaded
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Layer 3: Rate Limiting                                                     │
│                                                                             │
│  → Per-day (10K) + Per-minute (60) dual-layer limits                        │
│  → Global accuracy across all server instances                              │
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
│  Layer 4: Write Throttling (fire-and-forget)                                │
│                                                                             │
│  → Throttles lastUsedAt / lastActivityAt database writes (30s interval)     │
│  → Reduces database writes by ~97%                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Layer | Purpose | Latency Saved |
|-------|---------|---------------|
| HTTP Caching | Avoid hitting origin server entirely | ~50–500ms |
| Config Cache | Avoid database reads for project/key lookups | ~10–40ms |
| Rate Limiting | Prevent API abuse across all instances | N/A (enforcement) |
| Write Throttling | Reduce database write pressure | N/A (background) |

All server-side cache data is **ephemeral and rebuildable**. The database remains the sole source of truth.

---

## Layer 1: HTTP Caching (Browser & CDN)

HTTP caching is the outermost layer — it prevents requests from ever reaching the server. When a browser or CDN has a cached copy of an optimized image, it serves it directly without contacting the origin.

### Response Headers

Every successful image response includes:

```text
Cache-Control: public, s-maxage=31536000, max-age=31536000, immutable
```

### Cache-Control Directives

| Directive | Meaning |
|-----------|---------|
| `public` | Any cache (browser, CDN, proxy) may store this response |
| `s-maxage=31536000` | **Shared caches** (CDN, reverse proxy) may cache for **1 year** — the standard HTTP directive (RFC 7234) for controlling CDN cache duration |
| `max-age=31536000` | **Private caches** (browser) may cache for **1 year** (365 × 86,400 seconds) |
| `immutable` | Content will **never change** — browser should not revalidate even on hard refresh |

#### `public`

Declares that **any cache** — browser, CDN edge, reverse proxy — is permitted to store this response. Without `public`, shared caches may decline to cache responses that include certain headers (such as `Authorization`). Since optimized images are public resources with no user-specific content, `public` is the correct choice.

The opposite directive, `private`, restricts caching to the end user's browser only. Use `private` for responses containing personal or session-specific data (e.g. account pages, user dashboards).

#### `max-age=31536000`

Tells **private caches (browsers)** to treat the response as fresh for 31,536,000 seconds (365 days = 1 year). During this window, the browser serves the image directly from its local disk or memory cache — **no network request is made at all** (latency = 0ms). The timer starts when the browser receives the response, not when the server generated it.

After the `max-age` window expires, the browser must revalidate with the origin server before using the cached copy again (unless `immutable` is set — see below).

#### `s-maxage=31536000`

Tells **shared caches (CDNs, reverse proxies)** to treat the response as fresh for 1 year. The `s` stands for "shared". When `s-maxage` is present, shared caches use it **instead of** `max-age` — it acts as an override specifically for CDN-layer caching. Browsers always ignore `s-maxage`.

Having both directives allows **independent tuning** in the future. For example:

```text
Cache-Control: public, s-maxage=31536000, max-age=3600
```

This would keep CDN caching at 1 year while reducing browser cache to 1 hour — useful if you want browsers to check for updates more frequently while the CDN continues to serve cached copies at the edge.

#### `immutable`

Signals that the response body **will never change** for this URL. Without `immutable`, a user refreshing the page (F5) causes the browser to send a **conditional revalidation request** (`If-None-Match` / `If-Modified-Since`) — the server typically responds with `304 Not Modified`, but the round trip still costs network latency. With `immutable`, the browser **skips revalidation entirely** during the `max-age` window, even on manual refresh.

This is safe because image optimization URLs are content-addressable (see [Why This Strategy Works](#why-this-strategy-works) below): the URL encodes all transformation parameters and a cryptographic signature, so the same URL always produces the same output. If anything changes, a new URL is generated, which is treated as a completely separate cache entry.

> **Note:** When `s-maxage` is present, shared caches ignore `max-age` and use `s-maxage` instead. Browsers (private caches) always ignore `s-maxage` and use `max-age`. This separation allows independent tuning of CDN vs. browser cache durations in the future.

### Why This Strategy Works

Image optimization URLs are **content-addressable**: the same URL always produces the same output because the URL encodes the source image, all transformation parameters, and a cryptographic signature. Changing any parameter produces a different URL and therefore a different cache entry.

This makes aggressive caching safe — there is no risk of serving stale content because the URL itself changes when the content changes.

### CDN Behavior

The `s-maxage` directive is the HTTP standard (RFC 7234) way to control shared cache (CDN) duration. It is platform-agnostic and respected by all standards-compliant CDNs, including Vercel Edge Network, Cloudflare, AWS CloudFront, Fastly, Akamai, and Nginx reverse proxies.

When deployed behind any CDN:

```text
First request for /api/v1/my-blog/w_800,f_webp/cdn.example.com/photo.jpg?key=pk_abc&sig=xyz
  → CDN cache MISS → request reaches origin → origin processes image → CDN stores response

Second request (same URL)
  → CDN cache HIT → served from edge (~10ms) → origin never contacted
```

The `public` directive allows shared caches to store the response, while `s-maxage` explicitly sets the CDN cache duration. Together, they ensure correct caching behaviour regardless of which CDN is in front of the origin.

### ETag (Not Currently Implemented)

The system overview diagram mentions ETag as part of the cache layer. ETag enables **conditional requests**: on cache expiry, the browser sends `If-None-Match: "{etag}"` and the server can respond with `304 Not Modified` (a few bytes) instead of re-sending the full image.

However, because `immutable` is set, browsers will not send conditional requests during the 1-year `max-age` window. ETag would only matter if:

1. The `max-age` is reduced to a shorter duration
2. A CDN strips the `immutable` directive
3. A client does not support `immutable` (rare in modern browsers)

For now, the `immutable` directive makes ETag unnecessary for most scenarios. It may be added in the future as a defense-in-depth measure.

---

## Layer 2: Server-Side Configuration Cache

Every image request requires two lookups before processing can begin:

1. **Project configuration** — project ID, slug, team ID, allowed referer domains
2. **API key configuration** — key ID, allowed source domains, expiration, revocation status, rate limits

Both are cached server-side after the first lookup, with a **60-second TTL**. This avoids database queries on every image request while keeping data reasonably fresh.

### Cache Behavior

- **Cache hit** — Configuration is served from cache instantly (~1-5ms).
- **Cache miss** — Configuration is fetched from the database (~10-40ms), then cached for subsequent requests.
- **Negative caching** — When a project or API key doesn't exist, a "not found" marker is cached for **10 seconds** to prevent repeated database queries from probing attacks or typos.

### Invalidation

When you make changes through the dashboard (e.g. update project settings, revoke an API key), the relevant cache entries are **immediately invalidated**. Changes take effect instantly — the 60-second TTL only acts as a safety net for the rare case where invalidation fails.

If you update settings via direct database queries (not through the dashboard), changes will take effect within 60 seconds when the cache naturally expires.

---

## Layer 3: Rate Limiting

Rate limiting enforces per-API-key request limits to prevent abuse. All server instances share the same counters, making the limits globally accurate.

### Algorithm: Sliding Window

Unlike fixed windows that reset at hard boundaries (allowing up to 2× burst at the boundary), sliding windows produce smooth limits with no boundary spikes:

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

### Dual-Layer Limits

Each API key is checked against two independent limits. Both must pass for the request to proceed.

| Layer | Default Limit | Window | Purpose |
|-------|---------------|--------|---------|
| Per-day | **10,000 requests** | 24 hours | Catch sustained overuse |
| Per-minute | **60 requests** | 1 minute | Catch sudden bursts |

### Configuration

Rate limits are **per API key**, stored in the database:

| Database Column | Type | Default (fallback) |
|-----------------|------|--------------------|
| `apiKeys.rateLimitPerMinute` | `integer | null` | `60` |
| `apiKeys.rateLimitPerDay` | `integer | null` | `10000` |

**To change limits for a specific API key:** Update the `rateLimitPerMinute` and/or `rateLimitPerDay` columns in the `apiKeys` table. Changes made through the dashboard take effect immediately; direct database changes take effect within 60 seconds (cache TTL).

### Response When Rate Limited

When a request exceeds the rate limit, the API returns:

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

The `Retry-After` header indicates how many seconds to wait before retrying. Clients should respect this value to avoid further 429 responses.

---

## Layer 4: Write Throttling

Every image request updates two timestamps in the database:

- `apiKeys.lastUsedAt` — when this API key was last used
- `projects.lastActivityAt` — when this project last had activity

To avoid excessive database writes, the system throttles these updates to **at most once per 30 seconds** per entity. This reduces database writes by up to **97%** under sustained load while maintaining sufficient precision for the "last used N minutes ago" display in the dashboard.

| Scenario (60 req/min) | Without Throttling | With Throttling (30s) |
|------------------------|--------------------|-----------------------|
| Database writes per minute (key) | 60 | 2 |
| Database writes per minute (project) | 60 | 2 |
| **Total writes per minute** | **120** | **4** |

Write throttling runs as **fire-and-forget** — it never blocks or delays the image response.

---

## Data Durability

Server-side cache data contains **zero persistent data**. Every cached entry falls into one of three categories:

| Category | Source of Truth | If Cache Is Wiped |
|----------|----------------|-------------------|
| Config cache | Database | Next request refills from database (higher latency for one request) |
| Rate limit counters | None (ephemeral by nature) | Counters reset to zero (briefly allows over-limit requests) |
| Write throttle locks | None (control flags) | Triggers one extra database write per entity (harmless) |

---

## Failure Modes

All caching layers degrade gracefully rather than hard-failing requests. The system treats the cache as an **optimisation layer**, not a core dependency.

| Scenario | Behaviour | Impact | Severity |
|----------|-----------|--------|----------|
| Cache temporarily unreachable | Config falls back to direct database query; rate limiter fails open; usage tracker skips | Higher latency, no rate enforcement during outage | Medium |
| Cache data flushed | All caches miss; rate limits reset; throttle locks gone — system self-heals on next request | Brief burst of database queries + briefly allows over-limit requests | Low |
| Cache latency spike | Request latency increases but still completes | Slower responses | Low |

### Fail-Open Design Rationale

The system intentionally **fails open** (allows requests through) rather than **fails closed** (rejects all requests) when the cache is unavailable:

- **Config cache** — The data is always available from the database. Caching is purely a latency optimisation; falling back to database adds ~10-40ms per request but keeps the service operational.
- **Rate limiting** — Rate limits protect against abuse, but a temporary loss of enforcement is less damaging than a full outage. Brief disruptions are logged via `console.warn` for operator alerting.
- **Usage tracking** — Already fire-and-forget by design. A missed `lastUsedAt` update is harmless and will self-correct on the next successful write cycle.

> **Note:** If your threat model requires fail-closed rate limiting (e.g. protecting a paid API with strict billing), you can change the rate limiter to reject requests when the cache is unavailable. The current fail-open default prioritises availability for an image optimisation CDN layer where brief unmetered access is acceptable.

---

## Configuration Reference

A quick-reference table of every tunable value:

| Setting | Default | How to Change |
|---------|---------|---------------|
| HTTP cache s-maxage (CDN) | `31536000` (1 year) | Edit `s-maxage` value in `route.ts`, redeploy |
| HTTP cache max-age (browser) | `31536000` (1 year) | Edit `max-age` value in `route.ts`, redeploy |
| Config cache TTL | `60` seconds | Edit `CACHE_TTL_SECONDS` in `config-cache.ts`, redeploy |
| Negative cache TTL | `10` seconds | Edit `NEGATIVE_CACHE_TTL_SECONDS` in `config-cache.ts`, redeploy |
| Rate limit per minute | `60` requests | Update `rateLimitPerMinute` column per API key in DB |
| Rate limit per day | `10,000` requests | Update `rateLimitPerDay` column per API key in DB |
| Rate limit default (minute) | `60` | Edit fallback value in `config-cache.ts`, redeploy |
| Rate limit default (day) | `10,000` | Edit fallback value in `config-cache.ts`, redeploy |
| Write throttle interval | `30` seconds | Edit `THROTTLE_SECONDS` in `usage-tracker.ts`, redeploy |

### Environment Variables

Redis connectivity is configured via environment variables:

| Variable | Description |
|----------|-------------|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |

---

## Tuning Recommendations

### Low-Traffic Projects (< 100 req/day)

The defaults are well-suited for low-traffic use. No changes needed.

### Medium-Traffic Projects (100–10,000 req/day)

Defaults should work well. Monitor rate limit analytics to see if limits are being hit legitimately. If so, increase the per-day limit for affected API keys.

### High-Traffic Projects (> 10,000 req/day)

| Setting | Suggested Change | Reason |
|---------|-----------------|--------|
| Config cache TTL | Increase to `120`–`300` seconds | Fewer cache misses under heavy load |
| Write throttle interval | Increase to `60` seconds | Further reduces database write pressure |
| Per-key rate limits | Set per key based on expected traffic | Avoid false 429s for legitimate heavy users |

### After Changing Database Rate Limits

When you update `rateLimitPerMinute` or `rateLimitPerDay` in the database:

1. The cached configuration still holds the **old** limits for up to 60 seconds.
2. Changes made through the dashboard take effect **immediately** (automatic cache invalidation).
3. Changes made via direct SQL queries take effect after the cache TTL expires (~60 seconds).

---

## Related Documentation

| Document | Description |
|----------|-------------|
| [Redis Schema](./redis-schema.md) | Internal Redis key schema, implementation patterns, and serialization details |
| [System Overview](./system-overview.md) | Full system architecture |
| [Access Control](./access-control.md) | Multi-layer permission model |
| [Security](../security-qa/security.md) | Security design and threat model |
