# Redis Architecture

This document describes how OptStuff uses Redis across the image optimization API, the design patterns employed, and the benefits each pattern provides.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [1. Configuration Cache](#1-configuration-cache)
- [2. Rate Limiting](#2-rate-limiting)
- [3. Write Throttling](#3-write-throttling)
- [Redis Key Schema](#redis-key-schema)
- [Data Durability](#data-durability)
- [Failure Modes](#failure-modes)

---

## Architecture Overview

Redis serves three distinct roles in the request pipeline. Each role uses a different design pattern suited to its problem:

```text
                          Image API Request
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      Serverless Function                             │
│                                                                      │
│  ① Config Cache ─── Cache-Aside ──────── Reduces DB read load        │
│         │                                                            │
│  ② Rate Limiting ── Sliding Window ───── Prevents API abuse          │
│         │                                                            │
│  ③ Write Throttle ─ Distributed Lock ─── Reduces DB write load       │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
   Upstash Redis         PostgreSQL
   (ephemeral)          (source of truth)
```

All data stored in Redis is **ephemeral and rebuildable**. PostgreSQL remains the sole source of truth.

---

## 1. Configuration Cache

**File:** `src/server/lib/config-cache.ts`
**Pattern:** Cache-Aside (Lazy Population)

### What It Does

Every image request requires loading `ProjectConfig` and `ApiKeyConfig` from the database. The cache stores these results in Redis for 60 seconds so that subsequent requests skip the database query. The API key's secret is stored in its **encrypted** form in Redis and decrypted only after retrieval — plaintext secrets are never written to the cache.

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

getProjectConfig("my-blog")               ← used for best-effort error logging only
│
├─ Redis GET cache:project:slug:my-blog
│  ├─ HIT (config)       → return cached config
│  ├─ HIT (__NOT_FOUND__) → return null (negative cache hit)
│  └─ MISS → SELECT from PostgreSQL WHERE slug = ?
│            ├─ not found → Redis SET __NOT_FOUND__ (EX 10s) → return null
│            └─ found     → Redis SET config (EX 60s) → return config
```

On dashboard mutations (e.g. revoking an API key or updating project settings), the tRPC handler calls `invalidateProjectCache()` or `invalidateApiKeyCache()` to immediately delete the relevant Redis keys. This provides **instant consistency for admin operations** while the TTL acts as a safety net for any edge cases.

### Benefits

| Benefit | Detail |
|---------|--------|
| Lower DB load | Repeated lookups for the same project/key hit Redis (~1-5ms) instead of PostgreSQL (~10-40ms) |
| Cross-instance sharing | All serverless instances share one cache, unlike in-memory Maps that start empty on every cold start |
| Active invalidation | Dashboard changes take effect immediately via explicit key deletion, not just TTL expiry |
| Negative caching | Non-existent slugs/keys are cached with a shorter TTL (10s) to absorb probing attacks and repeated invalid lookups |
| Automatic cleanup | TTL handles eviction — no manual garbage collection needed |

### TTL Trade-off (60 seconds)

A shorter TTL gives fresher data but more DB queries. A longer TTL gives better hit rates but delays propagation of changes. 60 seconds balances both — admin operations bypass this via active invalidation, so the TTL only matters for the rare case where invalidation fails.

### Serialization and Secret Handling

`ApiKeyConfig` contains `expiresAt` and `revokedAt` as `Date | null`. Since JSON has no native Date type, these are stored as ISO 8601 strings in Redis and converted back to Date objects on read. Additionally, the API key's secret is stored in its encrypted form (`encryptedSecretKey`) in Redis — never as plaintext — and is only decrypted via `decryptApiKey` after retrieval from cache. A dedicated `CachedApiKeyConfig` type enforces both transformations at compile time.

**Why revoked keys are cached (not filtered out):** The database query in `getApiKeyConfig` deliberately does **not** filter by `revokedAt`. This ensures that when the cache refreshes from the database, the `revokedAt` timestamp is present in the cached entry. The route handler then performs a defense-in-depth check: if `apiKey.revokedAt` is set, the request is rejected with a `401 API key has been revoked` error. Without this, the `isNull(revokedAt)` filter would cause revoked keys to return `null` from the DB — indistinguishable from a non-existent key — making the route handler's revocation check dead code. Active invalidation via `invalidateApiKeyCache` remains the primary revocation mechanism; caching `revokedAt` acts as a safety net for stale entries.

---

## 2. Rate Limiting

**File:** `src/server/lib/rate-limiter.ts`
**Pattern:** Sliding Window Counter (via `@upstash/ratelimit`)

### What It Does

Enforces per-API-key request limits at two granularities: per-minute and per-day. All serverless instances share the same counters, making the limit globally accurate.

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

### Why Day Is Checked First

Upstash's `.limit()` is a consume-and-check operation — it decrements the counter atomically before returning the result. If the minute limit were checked first, a successful minute check would consume a minute token; a subsequent day rejection would block the request, but the minute token is already spent. Under sustained day-limit exhaustion this drains the minute counter for requests that never proceed.

Checking the day limit first inverts the problem: if day fails, no minute token is consumed. If day passes but minute fails, a day token is wasted — but this is negligible relative to a typical 10,000-token day pool.

> **Note:** Upstash also provides a non-consuming `getRemaining()` method that can query remaining tokens without decrementing. This could be used as a pre-check to avoid any token waste, at the cost of an extra Redis round trip per request. The current order-swap approach avoids this overhead while eliminating the most impactful waste scenario.

### Why Sliding Window Over Fixed Window

Fixed window counters reset at hard boundaries (e.g. every minute at :00). This allows a burst of up to 2× the limit across the boundary:

```text
Fixed Window:
  Window 1 [11:00:00 - 11:01:00]    Window 2 [11:01:00 - 11:02:00]
              ... 0 req ... 59 req │ 60 req ...
                                   ↑
                            119 requests in ~1 second
```

Sliding window weighs the previous window's count by how much of it overlaps with the current window, producing a smooth limit with no boundary spikes:

```text
Sliding Window at 11:01:15 (25% into current window):
  Previous window count = 42
  Current window count  = 18
  Weighted count = 42 × 0.75 + 18 = 49.5 → under limit, allowed
```

### Dual-Layer Design

The minute limit catches **burst abuse** (sudden spike in requests). The day limit catches **sustained abuse** (steady high-frequency usage over hours). The day limit is checked first to prevent wasting minute-window tokens (see [Why Day Is Checked First](#why-day-is-checked-first)).

### Benefits

| Benefit | Detail |
|---------|--------|
| Global accuracy | Shared Redis counters mean the limit applies across all instances, not per-instance |
| Atomic counting | Redis executes increment + check in a single operation — no race conditions |
| No boundary bursts | Sliding window prevents the 2× spike that fixed windows allow at reset points |
| Automatic expiry | Window counters expire naturally — no cleanup jobs needed |
| Built-in analytics | `@upstash/ratelimit` with `analytics: true` reports usage metrics to the Upstash dashboard |

### Ratelimit Instance Lifecycle

`Ratelimit` instances are lightweight configuration objects — they hold a reference to the shared Redis client, the window algorithm, and a key prefix. They are stateless: all actual counters live in Redis. Instances are created inline per `checkRateLimit` call rather than cached in-memory, because the construction cost is negligible and avoiding module-level `Map` state simplifies the code for serverless environments where containers are recycled frequently.

---

## 3. Write Throttling

**File:** `src/server/lib/usage-tracker.ts`
**Pattern:** Distributed Lock via SET NX (Set-If-Not-Exists)

### What It Does

Every image request should update `apiKeys.lastUsedAt` and `projects.lastActivityAt` in the database. Without throttling, a key handling 60 req/min would produce 120 UPDATE queries per minute. The throttle reduces this to at most 2 UPDATEs per 30-second window (one for the key, one for the project).

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

Both operations are fire-and-forget — they do not block the image response.

### Why SET NX Instead of In-Memory Batching

The previous design used an in-memory `Map` with `setTimeout` to batch writes every 5 seconds. This fails in serverless because:

1. `setTimeout` does not fire if the container is recycled before the timer
2. Pending updates in the `Map` are permanently lost on container recycle
3. Multiple instances maintain separate Maps, limiting deduplication effectiveness

`SET NX EX` solves all three problems: it is a single atomic Redis command with no dependency on timers, container lifecycle, or instance-local state.

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

### Benefits

| Benefit | Detail |
|---------|--------|
| DB write reduction | From N writes per 30s to exactly 1, regardless of request volume |
| Cross-instance dedup | All instances share the same Redis lock — no duplicate writes |
| No timer dependency | Works correctly in serverless — no `setTimeout` or `setInterval` needed |
| Automatic reset | `EX 30` ensures the lock expires, allowing the next write cycle |
| Fire-and-forget | Does not add latency to the image response |

### Throttle Interval (30 seconds)

`lastUsedAt` is displayed in the dashboard as "last used N minutes ago". A 30-second precision is more than sufficient for this use case, while reducing DB writes by up to ~97% under sustained load (e.g. 60 req/min → 4 writes/min instead of 120).

---

## Redis Key Schema

| Prefix | Purpose | TTL | Example |
|--------|---------|-----|---------|
| `cache:project:id:` | Project config cache (by ID) | 60s | `cache:project:id:uuid-123` |
| `cache:project:slug:` | Project config cache (by slug) | 60s | `cache:project:slug:my-blog` |
| `cache:project:team-slug:` | Team+Project config cache | 60s | `cache:project:team-slug:acme/my-blog` |
| `cache:apikey:prefix:` | API key config cache | 60s | `cache:apikey:prefix:pk_abc123` |
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

All Redis-dependent code paths degrade gracefully rather than hard-failing requests. The system treats Redis as an **optimisation layer**, not a core dependency — PostgreSQL remains the sole source of truth and every request can be served without Redis at the cost of higher latency and temporarily relaxed rate limits.

| Scenario | Behaviour | Impact | Severity |
|----------|-----------|--------|----------|
| Redis temporarily unreachable | Config cache falls back to direct DB query; rate limiter fails open (allows requests); usage tracker skips (fire-and-forget) | Higher latency, no rate enforcement during outage | Medium |
| Redis data flushed | All caches miss; rate limits reset; throttle locks gone — system self-heals on next request | Brief burst of DB queries + briefly allows over-limit requests | Low |
| Redis instance deleted (e.g. 14-day inactivity on free tier) | Same as "temporarily unreachable" — every request falls back to DB and rate limits are not enforced until a new instance is provisioned | Sustained DB load increase, no rate protection | High |
| Redis latency spike | Request latency increases but still completes | Slower responses | Low |

### Design Rationale: Fail-Open

The system intentionally **fails open** (allows requests through) rather than **fails closed** (rejects all requests) when Redis is unavailable:

- **Config cache** — The data is always available from PostgreSQL. Redis is purely a latency optimisation; falling back to DB adds ~10-40 ms per request but keeps the service operational.
- **Rate limiting** — Rate limits protect against abuse, but a temporary loss of enforcement is less damaging than a full outage. A brief Redis disruption lasting seconds is not enough for meaningful abuse; prolonged outages surface via `console.warn` logs for operator alerting.
- **Usage tracking** — Already fire-and-forget by design. A missed `lastUsedAt` update is harmless and will self-correct on the next successful write cycle.

> **Note:** If your threat model requires fail-closed rate limiting (e.g. protecting a paid API with strict billing), you can change the `checkRateLimit` catch block to return `{ allowed: false, ... }` instead. The current fail-open default prioritises availability for an image optimisation CDN layer where brief unmetered access is acceptable.

---

## Related Documentation

| Document | Description |
|----------|-------------|
| [System Overview](./system-overview.md) | Full system architecture |
| [Access Control](./access-control.md) | Multi-layer permission model |
| [Security](../security-qa/security.md) | Security design and threat model |
