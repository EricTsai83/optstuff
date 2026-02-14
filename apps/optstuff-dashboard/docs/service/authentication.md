# Request Authentication Flow

This document describes how requests to the image optimization API are authenticated.

## Overview

Every request to the image optimization service must be authenticated using **signed URLs**. The authentication system uses HMAC-SHA256 signatures to verify that requests are authorized and have not been tampered with.

## Terminology

| Term | Description |
|------|-------------|
| **API Key** | A set of authentication credentials created by the user through the Dashboard (**not a single string**). Contains a key pair (publicKey + secretKey) along with access settings (allowed source domains, rate limits, expiration, etc.). Analogy: like an **access card** — the card number printed on the front (publicKey), a chip password embedded inside (secretKey), and rules for which floors and time slots it grants access to (access settings) |
| **publicKey** (`pk_...`) | The public identifier of an API Key, used to identify which API Key a request belongs to. Safe to expose in URLs — similar to the **card number** on an access card |
| **secretKey** (`sk_...`) | The private key of an API Key, used to generate and verify HMAC-SHA256 signatures. Never appears in URLs — similar to the **chip password** embedded inside an access card |

## URL Format

```text
GET /api/v1/{projectSlug}/{operations}/{imageUrl}?key={publicKey}&sig={signature}&exp={expiry}
```

**Path Parameters:**
- `projectSlug`: Your project identifier (e.g., `my-blog`)
- `operations`: Image transformation operations (e.g., `w_800,f_webp` or `_` for no transformations)
- `imageUrl`: The source image URL without protocol (e.g., `images.example.com/photo.jpg`)

**Query Parameters:**
- `key` (required): Public key (e.g., `pk_abc123...`)
- `sig` (required): HMAC-SHA256 signature of the path
- `exp` (optional): Expiration timestamp in Unix seconds

**Example:**
```text
/api/v1/my-blog/w_800,f_webp/images.example.com/photo.jpg?key=pk_abc123&sig=xyz789&exp=1706500000
```

## Authentication Flow

```text
Request: GET /api/v1/my-blog/w_800,f_webp/images.example.com/photo.jpg
         ?key=pk_abc123&sig=xyz789&exp=1706500000

┌─────────────────────────────────────────────────────────────────────────┐
│ Step 1: Signature Parameter Parsing                                     │
│                                                                         │
│ Parse: key, sig, exp from query parameters                              │
│ Fail:  401 Missing signature parameters                                 │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ ✓
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Step 2: API Key Validation                                              │
│                                                                         │
│ Query: Use publicKey to look up the matching API Key                    │
│ Check: API Key exists, not revoked, not expired                         │
│ Fail:  401 Invalid API key / API key has been revoked / expired         │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ ✓
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Step 3: Project Validation (via API Key)                                │
│                                                                         │
│ Lookup: Find project by apiKey.projectId (not by URL slug)              │
│ Check:  Project exists and project.slug matches URL projectSlug         │
│ Fail:   404 Project not found / 401 API key does not belong to project  │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ ✓
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Step 4: Path Parsing                                                    │
│                                                                         │
│ Parse: {operations}/{imageUrl} from URL path                            │
│ Fail:  400 Invalid path format                                          │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ ✓
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Step 5: Signature Verification                                           │
│                                                                         │
│ Compute: expectedSig = HMAC-SHA256(secretKey, path + exp)               │
│ Compare: signature === expectedSig (constant-time comparison)           │
│ Fail:   403 Invalid or expired signature                                │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ ✓
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Step 6: Rate Limit Check                                                │
│                                                                         │
│ Check: Per-minute and per-day rate limits                               │
│ Note:  Placed after signature verification so unauthenticated            │
│        requests cannot exhaust quota with invalid signatures            │
│ Fail:  429 Rate limit exceeded                                          │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ ✓
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Step 7: Referer Validation (Project-level)                              │
│                                                                         │
│ Check: Referer header matches project.allowedRefererDomains             │
│ Note:  Empty allowlist = allow all referers                             │
│ Fail:  403 Forbidden: Invalid referer                                   │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ ✓
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Step 8: Source Domain Validation (API Key-level)                         │
│                                                                         │
│ Check: Image source domain matches apiKey.allowedSourceDomains          │
│ Note:  Empty allowlist = reject all (production) / allow all (dev)      │
│ Fail:  403 Forbidden: Source domain not allowed                         │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ ✓
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Step 9: Image Processing                                                │
│                                                                         │
│ Process: Apply transformations via IPX                                  │
│ Return:  Optimized image with caching headers                           │
└─────────────────────────────────────────────────────────────────────────┘
```

## Key Origin & End-to-End Flow

Understanding where `publicKey` and `signature` come from is essential to grasping the full authentication model.

### Who Does What?

There are three distinct actors in this system. Each has a specific, limited responsibility:

```text
┌──────────────────────────────────────────────────────────────────────────┐
│  1. Dashboard (one-time setup)                                           │
│                                                                          │
│     Developer creates an API Key → receives publicKey (pk_) + secretKey  │
│     (sk_) → stores them in their own server's environment variables      │
│                                                                          │
│     The Dashboard only issues keys. It does NOT generate signatures.     │
├──────────────────────────────────────────────────────────────────────────┤
│  2. Developer's Server (per request, automatic)                          │
│                                                                          │
│     For each image, the developer's server code automatically:           │
│       • Constructs the path ({operations}/{imageUrl})                    │
│       • Decides the exp (e.g. now + 1 hour, or omitted)                  │
│       • Computes sig = HMAC-SHA256(secretKey, path + exp)                │
│       • Assembles the full signed URL                                    │
│       • Embeds it in <img src="..."> and sends HTML to the browser       │
│                                                                          │
│     The signature is generated HERE, by the developer's own server.      │
├──────────────────────────────────────────────────────────────────────────┤
│  3. OptStuff Server (on receiving a request)                             │
│                                                                          │
│     Reads path, sig, exp, and publicKey from the incoming URL.           │
│     Looks up the API Key by publicKey → decrypts the secretKey.          │
│     Recomputes: expectedSig = HMAC-SHA256(secretKey, path + exp)         │
│     Compares: sig === expectedSig?                                       │
│       • Match    → the developer's server authorized this request → ✅   │
│       • Mismatch → not authorized (forged or tampered) → ❌              │
│                                                                          │
│     The server does NOT need a pre-registered list of valid paths.       │
│     A valid signature IS the proof that the path was authorized.         │
└──────────────────────────────────────────────────────────────────────────┘
```

> **Key insight**: The Dashboard only issues keys. The developer's server generates signatures. The OptStuff server verifies them. No single actor does everything.

### Where Does `publicKey` Come From?

The `publicKey` (`pk_...`) is generated when a user **creates an API Key** through the Dashboard:

```text
User creates API Key (Dashboard)
         │
         ▼
┌──────────────────────────────────────────────────────────────────────┐
│  generateApiKey()                                                    │
│                                                                      │
│  publicKey = "pk_" + crypto.randomBytes(16).toString("base64url")   │
│  secretKey = "sk_" + crypto.randomBytes(32).toString("base64url")   │
└──────────────────────────────────────────────────────────────────────┘
         │
         ├───────────────────────────────────┐
         ▼                                   ▼
┌─────────────────────────┐       ┌─────────────────────────┐
│  Store in Database       │       │  Return to User          │
│                          │       │                          │
│  publicKey: plaintext    │       │  publicKey: pk_xxx       │
│  secretKey: encrypted    │       │  secretKey: sk_xxx       │
│  (AES-256-GCM)           │       │                          │
└─────────────────────────┘       │  ⚠️ secretKey is shown   │
                                  │    only this once!        │
                                  └─────────────────────────┘
```

- **publicKey** is stored in plaintext in the database (safe, since it is only an identifier)
- **secretKey** is encrypted with AES-256-GCM before being stored in the database
- secretKey is only displayed once — at creation or rotation — and cannot be retrieved afterward

### Where Does `signature` Come From?

The `signature` is generated on the **caller's server** using `secretKey` to produce an HMAC-SHA256 signature of the URL path:

```text
Client Server (e.g., Next.js Server Component)
         │
         │  Known: publicKey, secretKey (from environment variables)
         │  Goal:  Generate a signed image URL
         │
         ▼
┌──────────────────────────────────────────────────────────────────────┐
│  1. Construct path                                                   │
│     path = "{operations}/{imageUrl}"                                 │
│     e.g. "w_800,f_webp/images.example.com/photo.jpg"                │
│                                                                      │
│  2. Construct payload (with optional expiration)                     │
│     payload = expiresAt ? `${path}?exp=${expiresAt}` : path          │
│                                                                      │
│  3. Generate signature                                               │
│     signature = HMAC-SHA256(secretKey, payload)                      │
│                 .digest("base64url")                                 │
│                 .substring(0, 32)                                    │
│                                                                      │
│  4. Construct final URL                                              │
│     /api/v1/{slug}/{path}?key={publicKey}&sig={signature}&exp={exp}  │
└──────────────────────────────────────────────────────────────────────┘
```

> **Key concept**: The `signature` proves that the requester possesses the `secretKey`, without exposing the `secretKey` itself in the URL. The server looks up the corresponding API Key via `publicKey`, retrieves and decrypts the `secretKey`, and recomputes the signature to verify.

### Signature Lifecycle

The signature is **never stored anywhere** — not in the database, not in a cache. It is a purely computed artifact: generated on the caller's server, and recomputed on the OptStuff server for comparison.

#### Three Inputs to the Signature

Generating or verifying a signature requires three input values, each from a different source:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  signature = HMAC-SHA256( secretKey, path [+ exp] )                        │
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐      │
│  │    secretKey      │  │      path        │  │        exp           │      │
│  │                   │  │                  │  │                      │      │
│  │  Source: DB       │  │  Source: URL     │  │  Source: URL query   │      │
│  │  (encrypted)      │  │  (dynamic)       │  │  (caller decides)   │      │
│  │                   │  │                  │  │                      │      │
│  │  sk_xxx...        │  │  {operations}/   │  │  Unix timestamp     │      │
│  │                   │  │  {imageUrl}      │  │  (optional)         │      │
│  └──────────────────┘  └──────────────────┘  └──────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Input | Storage | Description |
|-------|---------|-------------|
| **secretKey** | DB (`api_key` table, AES-256-GCM encrypted) | Generated when the API Key is created, encrypted and persisted. Retrieved and decrypted via `publicKey` lookup during verification |
| **path** | Not stored — from the HTTP request URL path | `{operations}/{imageUrl}`, different for every request. Constructed by the caller, parsed from the URL by the server |
| **exp** | Not stored — from the HTTP request query parameter | Expiration time (Unix seconds) decided by the caller, optional. Parsed from `?exp=` by the server |

#### Generation & Verification: Same Formula, Two Locations

The security of the signature relies on a core principle: **only the two parties that both know the `secretKey` can compute the same signature for a given `path + exp`.**

```text
    Caller's Server (generate)                 OptStuff Server (verify)
    ──────────────────────────                 ────────────────────────

    Known:                                     Known:
    • secretKey (env variable)                 • secretKey (DB lookup + decrypt)
    • path (self-constructed)                  • path (parsed from URL)
    • exp (self-determined)                    • exp (parsed from query string)

           │                                          │
           ▼                                          ▼
    sig = HMAC-SHA256(                         expectedSig = HMAC-SHA256(
            secretKey,                                        secretKey,
            path + exp                                        path + exp
          )                                                 )
           │                                          │
           ▼                                          ▼
    Embed in URL: ?sig={sig}  ── HTTP request ──►  Compare: sig === expectedSig ?
                                                   ✅ Pass / ❌ Reject
```

> **Why is this secure?** Even if an attacker intercepts the `sig` from the URL, they cannot:
> - Reverse-engineer the `secretKey` (HMAC-SHA256 is a one-way function)
> - Forge a signature for a different path (a different path produces a completely different sig)
> - Extend the expiration (modifying `exp` causes signature verification to fail)

### End-to-End Lifecycle

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Phase 1: Key Provisioning (one-time, via Dashboard)                         │
│                                                                             │
│   User ── Create API Key ──► Dashboard ── generateApiKey() ──►              │
│                                            publicKey + secretKey            │
│                                                                             │
│   User stores secretKey in server environment variables (e.g. .env)         │
│   publicKey also stored in env vars (for convenience; not a secret)         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Phase 2: URL Signing (per request, executed on caller's server)             │
│                                                                             │
│   path = "w_800,f_webp/images.example.com/photo.jpg"                        │
│   sig  = HMAC-SHA256(secretKey, path)  ← sign with secretKey               │
│   url  = /api/v1/{slug}/{path}?key={publicKey}&sig={sig}                    │
│                                                                             │
│   Embed signed URL in HTML <img src="..."> and send to browser             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Phase 3: Request Validation (OptStuff server receives request)              │
│                                                                             │
│   1. Parse publicKey, signature, exp from URL                               │
│   2. Look up API Key in database using publicKey                            │
│   3. Retrieve and decrypt secretKey from the API Key record                 │
│   4. Recompute: expectedSig = HMAC-SHA256(secretKey, path)                  │
│   5. Compare: signature === expectedSig (timingSafeEqual)                   │
│   6. Pass → process image; Fail → return 401/403                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Why This Design?

| Design Choice | Reason |
|---------------|--------|
| Separate publicKey and secretKey | publicKey can be safely exposed in URLs; secretKey never leaves the server |
| HMAC-SHA256 signatures | One-way hash — even if a signature is intercepted, the secretKey cannot be reverse-engineered |
| Encrypted secretKey storage | Even if the database is compromised, attackers cannot obtain the raw secretKey |
| Optional `exp` expiration | Limits signature validity window, preventing replay attacks |

> **Further reading**: For the full API Key creation flow, see [Create API Key Flow](../user-flow/create-api-key-flow.md)

## Generating Signed URLs

### Signature Algorithm

The signature is computed using HMAC-SHA256:

```typescript
import { createHmac } from "crypto";

function createUrlSignature(
  secretKey: string,
  path: string,
  expiresAt?: number,
): string {
  // Include expiration in the payload if provided
  const payload = expiresAt ? `${path}?exp=${expiresAt}` : path;
  
  const signature = createHmac("sha256", secretKey)
    .update(payload)
    .digest("base64url")
    .substring(0, 32); // Truncate for shorter URLs
  
  return signature;
}
```

### Path Construction

The signing path must be constructed as: `{operations}/{imageUrl}`

```typescript
// Example
const operations = "w_800,f_webp";
const imageUrl = "images.example.com/photo.jpg";
const path = `${operations}/${imageUrl}`; // "w_800,f_webp/images.example.com/photo.jpg"
```

### Complete Example

```typescript
import { createHmac } from "crypto";

// Your secret key (stored securely on your server)
const secretKey = "sk_your_secret_key";
const publicKey = "pk_abc123..."; // Your public key (from dashboard)

// Build the signed URL
const projectSlug = "my-blog";
const operations = "w_800,f_webp";
const imageUrl = "images.example.com/photo.jpg";
const path = `${operations}/${imageUrl}`;

// Optional: Set expiration (Unix timestamp in seconds)
const expiresAt = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

// Generate signature
const payload = expiresAt ? `${path}?exp=${expiresAt}` : path;
const signature = createHmac("sha256", secretKey)
  .update(payload)
  .digest("base64url")
  .substring(0, 32);

// Construct the final URL
const url = `/api/v1/${projectSlug}/${path}?key=${publicKey}&sig=${signature}&exp=${expiresAt}`;
// Result: /api/v1/my-blog/w_800,f_webp/images.example.com/photo.jpg?key=pk_abc123...&sig=xyz789...&exp=1706500000
```

## Security Features

### Constant-Time Signature Comparison

Signatures are compared using constant-time comparison to prevent timing attacks:

```typescript
import { timingSafeEqual } from "crypto";

const sigBuffer = Buffer.from(signature);
const expectedBuffer = Buffer.from(expectedSignature);

if (sigBuffer.length !== expectedBuffer.length) {
  return false;
}

return timingSafeEqual(sigBuffer, expectedBuffer);
```

### Two-Layer Domain Validation

1. **Project-level (Referer)**: Controls which websites can embed optimized images
   - Configure via `allowedRefererDomains` in project settings
   - Supports subdomains (e.g., `example.com` allows `sub.example.com`)
   - Empty list = allow all referers

2. **API Key-level (Source)**: Controls which image sources can be optimized
   - Configure via `allowedSourceDomains` in API Key settings
   - Supports subdomains matching
   - Empty list = reject all in production, allow all in development

### Signature Expiration

Optional URL expiration prevents replay attacks:

```typescript
// Check expiration (Unix timestamp in seconds)
if (expiresAt && Date.now() > expiresAt * 1000) {
  return false; // Signature expired
}
```

## Error Responses

| Code | Error | Cause | Solution |
|------|-------|-------|----------|
| 400 | Invalid path format | URL path is malformed | Check URL format |
| 400 | Invalid image URL | Image URL cannot be parsed | Verify the image URL |
| 401 | Missing signature parameters | Missing `key` or `sig` parameter | Include both parameters |
| 401 | Invalid API key | API Key not found or revoked | Verify API Key or create new one |
| 401 | API key has expired | API Key past expiration date | Renew or create new API Key |
| 401 | API key does not belong to this project | Mismatched key/project | Use correct API Key for project |
| 403 | Invalid or expired signature | Signature verification failed | See troubleshooting below |
| 403 | Forbidden: Invalid referer | Referer not in allowlist | Add domain to project settings |
| 403 | Forbidden: Source domain not allowed | Image source not in allowlist | Add domain to API Key settings |
| 404 | Project not found | Project does not exist | Check projectSlug |
| 429 | Rate limit exceeded | Per-minute or per-day limit exceeded | Wait for `Retry-After` seconds or increase limit |
| 500 | Image processing failed | Error processing image | Check if image URL is accessible |

## Troubleshooting Signature Errors

When encountering `403 Invalid or expired signature`, check the following:

### 1. Correct Secret Key

Ensure you're using the secret key (`sk_...`) associated with the API Key, not the public key.

### 2. Path Construction

```typescript
// ✅ Correct: {operations}/{imageUrl}
const path = "w_800,f_webp/images.example.com/photo.jpg";

// ❌ Wrong: {imageUrl}/{operations}
const path = "images.example.com/photo.jpg/w_800,f_webp";
```

### 3. Expiration Timestamp Format

```typescript
// ✅ Correct: Unix seconds
const exp = Math.floor(Date.now() / 1000) + 3600;

// ❌ Wrong: Unix milliseconds
const exp = Date.now() + 3600000;
```

### 4. Payload Format with Expiration

```typescript
// ✅ Correct: path?exp={timestamp}
const payload = `w_800,f_webp/images.example.com/photo.jpg?exp=1706500000`;

// ❌ Wrong: missing exp in payload
const payload = `w_800,f_webp/images.example.com/photo.jpg`;
```

### 5. Signature Encoding

```typescript
// ✅ Correct: base64url encoding, truncated to 32 chars
const signature = hmac.digest("base64url").substring(0, 32);

// ❌ Wrong: standard base64 (contains +, /, =)
const signature = hmac.digest("base64");
```

## Related Documentation

- [Integration Guide](./integration-guide.md) - Step-by-step integration instructions
- [Access Control](../system-design/access-control.md) - Domain whitelist configuration
