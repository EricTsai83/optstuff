# Request Authentication Flow

This document describes how requests to the image optimization API are authenticated.

## Overview

Every request to the image optimization service must be authenticated using **signed URLs**. The authentication system uses HMAC-SHA256 signatures to verify that requests are authorized and have not been tampered with.

## URL Format

```
GET /api/v1/{projectSlug}/{operations}/{imageUrl}?key={keyPrefix}&sig={signature}&exp={expiry}
```

**Path Parameters:**
- `projectSlug`: Your project identifier (e.g., `my-blog`)
- `operations`: Image transformation operations (e.g., `w_800,f_webp` or `_` for no transformations)
- `imageUrl`: The source image URL without protocol (e.g., `images.example.com/photo.jpg`)

**Query Parameters:**
- `key` (required): API key prefix (first 12 characters, e.g., `pk_abc123...`)
- `sig` (required): HMAC-SHA256 signature of the path
- `exp` (optional): Expiration timestamp in Unix seconds

**Example:**
```
/api/v1/my-blog/w_800,f_webp/images.example.com/photo.jpg?key=pk_abc123&sig=xyz789&exp=1706500000
```

## Authentication Flow

```
Request: GET /api/v1/my-blog/w_800,f_webp/images.example.com/photo.jpg
         ?key=pk_abc123&sig=xyz789&exp=1706500000

┌─────────────────────────────────────────────────────────────────────────┐
│ Step 1: Project Validation                                              │
│                                                                         │
│ Check: Does projectSlug "my-blog" exist?                                │
│ Fail:  404 Project not found                                            │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ ✓
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Step 2: Signature Parameter Parsing                                     │
│                                                                         │
│ Parse: key, sig, exp from query parameters                              │
│ Fail:  401 Missing signature parameters                                 │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ ✓
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Step 3: API Key Validation                                              │
│                                                                         │
│ Query: Find API key by keyPrefix                                        │
│ Check: API key exists, not revoked, belongs to project, not expired     │
│ Fail:  401 Invalid API key / API key has expired                        │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ ✓
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Step 4: Signature Verification                                          │
│                                                                         │
│ Compute: expectedSig = HMAC-SHA256(secretKey, path + exp)               │
│ Compare: signature === expectedSig (constant-time comparison)           │
│ Fail:   403 Invalid or expired signature                                │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ ✓
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Step 5: Referer Validation (Project-level)                              │
│                                                                         │
│ Check: Referer header matches project.allowedRefererDomains             │
│ Note:  Empty allowlist = allow all referers                             │
│ Fail:  403 Forbidden: Invalid referer                                   │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ ✓
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Step 6: Source Domain Validation (API Key-level)                        │
│                                                                         │
│ Check: Image source domain matches apiKey.allowedSourceDomains          │
│ Note:  Empty allowlist = reject all (production) / allow all (dev)      │
│ Fail:  403 Forbidden: Source domain not allowed                         │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ ✓
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Step 7: Image Processing                                                │
│                                                                         │
│ Process: Apply transformations via IPX                                  │
│ Return:  Optimized image with caching headers                           │
└─────────────────────────────────────────────────────────────────────────┘
```

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
const keyPrefix = "pk_abc123..."; // First 12 chars of your API key

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
const url = `/api/v1/${projectSlug}/${path}?key=${keyPrefix}&sig=${signature}&exp=${expiresAt}`;
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
   - Configure via `allowedSourceDomains` in API key settings
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
| 401 | Invalid API key | API key not found or revoked | Verify API key or create new one |
| 401 | API key has expired | API key past expiration date | Renew or create new API key |
| 401 | API key does not belong to this project | Mismatched key/project | Use correct API key for project |
| 403 | Invalid or expired signature | Signature verification failed | See troubleshooting below |
| 403 | Forbidden: Invalid referer | Referer not in allowlist | Add domain to project settings |
| 403 | Forbidden: Source domain not allowed | Image source not in allowlist | Add domain to API key settings |
| 404 | Project not found | Project does not exist | Check projectSlug |
| 500 | Image processing failed | Error processing image | Check if image URL is accessible |

## Troubleshooting Signature Errors

When encountering `403 Invalid or expired signature`, check the following:

### 1. Correct Secret Key

Ensure you're using the secret key (`sk_...`) associated with the API key, not the API key itself.

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
- [Access Control](../access-control.md) - Domain whitelist configuration
