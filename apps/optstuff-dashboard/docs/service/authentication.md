# Request Authentication

This document explains how the OptStuff image optimization API authenticates incoming requests using **signed URLs** with HMAC-SHA256 signatures.

## Table of Contents

- [Core Concepts](#core-concepts)
- [How It Works (Big Picture)](#how-it-works-big-picture)
- [URL Format](#url-format)
- [Authentication Flow (Step by Step)](#authentication-flow-step-by-step)
- [Generating Signed URLs](#generating-signed-urls)
- [Security Features](#security-features)
- [Error Reference](#error-reference)
- [Troubleshooting](#troubleshooting)

---

## Core Concepts

### What is a Signed URL?

A signed URL is a regular URL with an added **cryptographic signature** (`sig` query parameter). The signature is computed from the URL path using a secret key. When the server receives the request, it recomputes the signature using the same secret key — if they match, the request is authorized. If the URL has been modified in any way, the recomputed signature won't match and the request is rejected.

### API Key = A Key Pair + Access Rules

When you create an API Key through the Dashboard, you receive:

| Component | Example | Purpose |
|-----------|---------|---------|
| **publicKey** | `pk_abc123...` | Identifies which API Key the request belongs to. Safe to expose in URLs. |
| **secretKey** | `sk_xyz789...` | Used to generate signatures. **Never** appears in URLs. Store it on your server only. |

An API Key also carries **access rules**: allowed source domains, rate limits, expiration date, etc.

---

## How It Works (Big Picture)

There are **three actors** in this system. Each has a single, clear responsibility:

### 1. Dashboard — Issue Keys (One-Time Setup)

The developer creates an API Key on the Dashboard and receives a `publicKey` + `secretKey` pair. These are stored as environment variables on the developer's own server.

The Dashboard **only issues keys**. It does not generate signatures.

### 2. Developer's Server — Sign URLs (Per Request)

For each image, the developer's server:

1. Constructs the path: `{operations}/{imageUrl}`
2. Computes the signature: `sig = HMAC-SHA256(secretKey, path + exp)`
3. Assembles the signed URL and embeds it in `<img src="...">`

The signature is generated **here**, by the developer's own server.

### 3. OptStuff Server — Verify & Serve (On Request)

When a request arrives, the OptStuff server:

1. Reads `publicKey`, `sig`, and `exp` from the URL
2. Looks up the API Key by `publicKey` and decrypts the stored `secretKey`
3. Recomputes: `expectedSig = HMAC-SHA256(secretKey, path + exp)`
4. Compares `sig === expectedSig`
   - **Match** → request is authorized → process the image
   - **Mismatch** → request is rejected

> **Key insight:** The server does not maintain a list of "valid URLs". A valid signature **is** the proof that the URL was authorized by someone who holds the `secretKey`.

---

## URL Format

```
GET /api/v1/{projectSlug}/{operations}/{imageUrl}?key={publicKey}&sig={signature}&exp={expiry}
```

### Path Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `projectSlug` | Your project identifier | `my-blog` |
| `operations` | Image transformations (`_` for none) | `w_800,f_webp` |
| `imageUrl` | Source image URL without protocol | `images.example.com/photo.jpg` |

### Query Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `key` | Yes | Public key (`pk_...`) |
| `sig` | Yes | HMAC-SHA256 signature of the path |
| `exp` | No | Expiration timestamp (Unix seconds) |

### Example

```
/api/v1/my-blog/w_800,f_webp/images.example.com/photo.jpg?key=pk_abc123&sig=xyz789&exp=1706500000
```

---

## Authentication Flow (Step by Step)

When a request hits the OptStuff server, it goes through these steps **in order**. If any step fails, the request is immediately rejected.

| Step | What Happens | Failure |
|------|-------------|---------|
| **1. Parse Parameters** | Extract `key`, `sig`, `exp` from query string | `401` Missing signature parameters |
| **2. Validate API Key** | Look up API Key by `publicKey`. Check: exists, not revoked, not expired | `401` Invalid / revoked / expired API key |
| **3. Validate Project** | Find project by `apiKey.projectId`. Confirm `project.slug` matches URL | `404` Project not found / `401` Key-project mismatch |
| **4. Parse Path** | Extract `{operations}/{imageUrl}` from URL path | `400` Invalid path format |
| **5. Verify Signature** | Recompute HMAC-SHA256 and compare with `sig` (constant-time) | `403` Invalid or expired signature |
| **6. Check Rate Limit** | Enforce per-minute and per-day limits | `429` Rate limit exceeded |
| **7. Validate Referer** | Check `Referer` header against project's `allowedRefererDomains` | `403` Invalid referer |
| **8. Validate Source Domain** | Check image source domain against API Key's `allowedSourceDomains` | `403` Source domain not allowed |
| **9. Process Image** | Apply transformations and return optimized image | `500` Processing failed |

> **Why is rate limiting after signature verification?** So that unauthenticated requests with invalid signatures cannot exhaust the rate limit quota.

---

## Generating Signed URLs

### Signature Formula

```
signature = HMAC-SHA256(secretKey, payload)
```

Where `payload` is:

- **With expiration:** `{operations}/{imageUrl}?exp={expiresAt}`
- **Without expiration:** `{operations}/{imageUrl}`

### Code Example

```typescript
import { createHmac } from "crypto";

// --- Configuration (from environment variables) ---
const SECRET_KEY = "sk_your_secret_key";
const PUBLIC_KEY = "pk_abc123";
const PROJECT_SLUG = "my-blog";

// --- Per-request ---
const operations = "w_800,f_webp";
const imageUrl = "images.example.com/photo.jpg";
const path = `${operations}/${imageUrl}`;

// Optional: set expiration (1 hour from now)
const expiresAt = Math.floor(Date.now() / 1000) + 3600;

// Generate signature
const payload = expiresAt ? `${path}?exp=${expiresAt}` : path;
const signature = createHmac("sha256", SECRET_KEY)
  .update(payload)
  .digest("base64url")
  .substring(0, 32); // Truncate for shorter URLs

// Assemble the final URL
const url = `/api/v1/${PROJECT_SLUG}/${path}?key=${PUBLIC_KEY}&sig=${signature}&exp=${expiresAt}`;
```

### Helper Function

```typescript
import { createHmac } from "crypto";

function createSignedUrl(options: {
  readonly projectSlug: string;
  readonly publicKey: string;
  readonly secretKey: string;
  readonly operations: string;
  readonly imageUrl: string;
  readonly expiresAt?: number;
}): string {
  const path = `${options.operations}/${options.imageUrl}`;
  const payload = options.expiresAt ? `${path}?exp=${options.expiresAt}` : path;

  const signature = createHmac("sha256", options.secretKey)
    .update(payload)
    .digest("base64url")
    .substring(0, 32);

  const params = new URLSearchParams({
    key: options.publicKey,
    sig: signature,
    ...(options.expiresAt && { exp: String(options.expiresAt) }),
  });

  return `/api/v1/${options.projectSlug}/${path}?${params.toString()}`;
}
```

---

## Security Features

### Signature Verification (Constant-Time)

Signatures are compared using `timingSafeEqual` to prevent [timing attacks](https://en.wikipedia.org/wiki/Timing_attack):

```typescript
import { timingSafeEqual } from "crypto";

const sigBuffer = Buffer.from(signature);
const expectedBuffer = Buffer.from(expectedSignature);

if (sigBuffer.length !== expectedBuffer.length) {
  return false;
}

return timingSafeEqual(sigBuffer, expectedBuffer);
```

### Encrypted Secret Key Storage

The `secretKey` is encrypted with **AES-256-GCM** before being stored in the database. Even if the database is compromised, attackers cannot obtain the raw key. The `secretKey` is only shown once — at creation or rotation.

### Signature Expiration

The optional `exp` parameter limits how long a signed URL remains valid, preventing replay attacks:

```typescript
if (expiresAt && Date.now() > expiresAt * 1000) {
  // Signature has expired — reject
}
```

### Two-Layer Domain Validation

| Layer | Scope | Controls | Empty List Behavior |
|-------|-------|----------|---------------------|
| **Referer** (project-level) | Which websites can embed images | `project.allowedRefererDomains` | Allow all |
| **Source** (API Key-level) | Which image origins can be optimized | `apiKey.allowedSourceDomains` | Reject all (prod) / Allow all (dev) |

Both layers support subdomain matching (e.g., `example.com` allows `sub.example.com`).

### Design Rationale Summary

| Choice | Why |
|--------|-----|
| Separate `publicKey` / `secretKey` | `publicKey` is safe in URLs; `secretKey` never leaves the server |
| HMAC-SHA256 | One-way — intercepting a signature cannot reveal the `secretKey` |
| AES-256-GCM encrypted storage | Database breach doesn't expose raw secret keys |
| Optional `exp` | Limits signature validity to prevent replay attacks |
| Rate limit after signature check | Prevents unauthenticated requests from exhausting quota |

---

## Error Reference

| Code | Error | Cause | Solution |
|------|-------|-------|----------|
| 400 | Invalid path format | Malformed URL path | Check URL format |
| 400 | Invalid image URL | Image URL cannot be parsed | Verify the image URL |
| 401 | Missing signature parameters | Missing `key` or `sig` | Include both query parameters |
| 401 | Invalid API key | API Key not found or revoked | Verify key or create a new one |
| 401 | API key has expired | API Key past expiration date | Renew or create a new API Key |
| 401 | API key does not belong to this project | Key-project mismatch | Use the correct key for the project |
| 403 | Invalid or expired signature | Signature verification failed | See [Troubleshooting](#troubleshooting) |
| 403 | Forbidden: Invalid referer | Referer not in allowlist | Add domain to project settings |
| 403 | Forbidden: Source domain not allowed | Image source not in allowlist | Add domain to API Key settings |
| 404 | Project not found | Project doesn't exist | Check `projectSlug` |
| 429 | Rate limit exceeded | Per-minute or per-day limit hit | Wait for `Retry-After` or increase limit |
| 500 | Image processing failed | Error processing image | Check if image URL is accessible |

---

## Troubleshooting

If you're getting `403 Invalid or expired signature`, check these common mistakes:

### 1. Wrong Key

Make sure you're signing with the **secret key** (`sk_...`), not the public key (`pk_...`).

### 2. Wrong Path Order

```typescript
// ✅ Correct: {operations}/{imageUrl}
const path = "w_800,f_webp/images.example.com/photo.jpg";

// ❌ Wrong: {imageUrl}/{operations}
const path = "images.example.com/photo.jpg/w_800,f_webp";
```

### 3. Wrong Timestamp Unit

```typescript
// ✅ Correct: Unix seconds
const exp = Math.floor(Date.now() / 1000) + 3600;

// ❌ Wrong: Unix milliseconds
const exp = Date.now() + 3600000;
```

### 4. Expiration Not Included in Payload

If you pass `exp` in the URL, you **must** include it in the signed payload too:

```typescript
// ✅ Correct: include exp in payload
const payload = `w_800,f_webp/images.example.com/photo.jpg?exp=1706500000`;

// ❌ Wrong: exp in URL but not in payload
const payload = `w_800,f_webp/images.example.com/photo.jpg`;
```

### 5. Wrong Encoding

```typescript
// ✅ Correct: base64url, truncated to 32 characters
const signature = hmac.digest("base64url").substring(0, 32);

// ❌ Wrong: standard base64 (contains +, /, =)
const signature = hmac.digest("base64");
```

---

## Related Documentation

- [Integration Guide](./integration-guide.md) — Step-by-step integration instructions
- [Access Control](../system-design/access-control.md) — Domain whitelist configuration
- [Create API Key Flow](../user-flow/create-api-key-flow.md) — Full API Key creation flow
