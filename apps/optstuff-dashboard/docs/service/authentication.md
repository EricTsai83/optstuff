# Request Authentication Flow

This document describes how requests to the image optimization API are authenticated.

## Overview

Every request to the image optimization service must be authenticated using **signed URLs**. The authentication system uses HMAC-SHA256 signatures to verify that requests are authorized and have not been tampered with.

## Terminology

本文件中使用的術語：

| 術語 | 說明 |
|------|------|
| **API Key** | 使用者在 Dashboard 建立的一組認證憑證（**不是單一字串**）。包含一對金鑰（publicKey + secretKey）以及存取設定（允許的 source domains、速率限制、過期時間等）。類比：像是一張**門禁卡**——卡片上印有卡號（publicKey），內嵌晶片密碼（secretKey），同時綁定了可進入的樓層和時段（存取設定） |
| **publicKey**（`pk_...`） | API Key 的公開識別碼，用來辨識是哪一組 API Key。可安全暴露在 URL 中，類似門禁卡上的**卡號** |
| **secretKey**（`sk_...`） | API Key 的私密金鑰，用來產生與驗證 HMAC-SHA256 簽名。絕不會出現在 URL 中，類似門禁卡內嵌的**晶片密碼** |

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
┌─────────────────────┐           ┌─────────────────────┐
│  Store in Database   │           │  Return to User     │
│                      │           │                      │
│  publicKey: 明文儲存  │           │  publicKey: pk_xxx   │
│  secretKey: 加密儲存  │           │  secretKey: sk_xxx   │
│  (AES-256-GCM)       │           │                      │
└─────────────────────┘           │  ⚠️ secretKey 只會    │
                                  │    顯示這一次！        │
                                  └─────────────────────┘
```

- **publicKey** 以明文存在資料庫中（安全，因為它只是識別碼）
- **secretKey** 以 AES-256-GCM 加密後才存入資料庫
- secretKey 只在建立或輪替（Rotate）時顯示一次，之後無法再取得

### Where Does `signature` Come From?

`signature` 是由**呼叫端（Client）**在伺服器端使用 `secretKey` 對 URL path 產生 HMAC-SHA256 簽名：

```text
Client Server (e.g., Next.js Server Component)
         │
         │  已知：publicKey, secretKey (環境變數)
         │  目標：產生簽名過的圖片 URL
         │
         ▼
┌──────────────────────────────────────────────────────────────────────┐
│  1. 組合路徑                                                          │
│     path = "{operations}/{imageUrl}"                                 │
│     例: "w_800,f_webp/images.example.com/photo.jpg"                  │
│                                                                      │
│  2. 組合 payload（含可選的過期時間）                                     │
│     payload = expiresAt ? `${path}?exp=${expiresAt}` : path          │
│                                                                      │
│  3. 產生簽名                                                          │
│     signature = HMAC-SHA256(secretKey, payload)                      │
│                 .digest("base64url")                                 │
│                 .substring(0, 32)                                    │
│                                                                      │
│  4. 組合最終 URL                                                      │
│     /api/v1/{slug}/{path}?key={publicKey}&sig={signature}&exp={exp}  │
└──────────────────────────────────────────────────────────────────────┘
```

> **關鍵概念**：`signature` 證明請求者擁有 `secretKey`，而不需要在 URL 中暴露 `secretKey` 本身。伺服器端透過 `publicKey` 查詢到對應的 API Key，從中取得 `secretKey`，重新計算簽名來驗證。

### End-to-End Lifecycle

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Phase 1: Key Provisioning (一次性，透過 Dashboard)                            │
│                                                                             │
│   User ──建立 API Key──► Dashboard ──generateApiKey()──► publicKey + secretKey│
│                                                                             │
│   User 將 secretKey 存入伺服器環境變數（如 .env）                              │
│   publicKey 也存入環境變數（方便管理，本身非機密）                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Phase 2: URL Signing (每次請求，呼叫端伺服器執行)                              │
│                                                                             │
│   path = "w_800,f_webp/images.example.com/photo.jpg"                        │
│   sig  = HMAC-SHA256(secretKey, path)  ← 用 secretKey 簽名                  │
│   url  = /api/v1/{slug}/{path}?key={publicKey}&sig={sig}                    │
│                                                                             │
│   將簽名過的 URL 嵌入 HTML <img src="..."> 傳送給瀏覽器                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Phase 3: Request Validation (OptStuff 伺服器接收請求)                         │
│                                                                             │
│   1. 從 URL 解析 publicKey, signature, exp                                  │
│   2. 用 publicKey 查詢資料庫 → 找到對應的 API Key                             │
│   3. 從 API Key 中取出並解密 secretKey                                      │
│   4. 重新計算: expectedSig = HMAC-SHA256(secretKey, path)                   │
│   5. 比對: signature === expectedSig (timingSafeEqual)                      │
│   6. 通過 → 處理圖片；失敗 → 回傳 401/403                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Why This Design?

| 設計選擇 | 原因 |
|----------|------|
| publicKey 與 secretKey 分離 | publicKey 可安全暴露在 URL 中，secretKey 永遠不離開伺服器 |
| HMAC-SHA256 簽名 | 單向雜湊，即使攔截到 signature 也無法反推 secretKey |
| secretKey 加密儲存 | 即使資料庫洩漏，攻擊者也無法取得原始 secretKey |
| 可選的 `exp` 過期時間 | 限制簽名有效期，防止 replay 攻擊 |

> **延伸閱讀**: 完整的 API Key 建立流程請參考 [Create API Key Flow](../user-flow/create-api-key-flow.md)

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
