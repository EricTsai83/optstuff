# OptStuff Dashboard

A secure, multi-tenant image optimization service built with Next.js. OptStuff provides on-the-fly image processing with signed URLs, domain whitelisting, and comprehensive usage tracking.

## Features

- **On-the-fly Image Optimization** - Resize, format conversion (WebP, AVIF), and more via [IPX](https://github.com/unjs/ipx)
- **Signed URL Security** - HMAC-SHA256 signatures prevent unauthorized access
- **Multi-tenant Architecture** - Teams → Projects → API Keys hierarchy
- **Domain Whitelisting** - Control allowed image sources and referer domains
- **Encrypted Key Storage** - AES-256-GCM encryption for API keys at rest
- **Usage Analytics** - Request logs, bandwidth tracking, and top images statistics

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| API | tRPC v11 |
| Database | PostgreSQL + Drizzle ORM |
| Auth | Clerk |
| UI | TailwindCSS + Radix UI + shadcn/ui |
| Image Processing | IPX + Sharp |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL database

### Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
# Required
DATABASE_URL="postgresql://user:password@localhost:5432/optstuff"
API_KEY_ENCRYPTION_SECRET="your-32-character-secret-key-here"  # openssl rand -base64 32
NEXT_PUBLIC_APP_URL="http://localhost:3024"

# Clerk Authentication
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
```

### Installation

```bash
# Install dependencies
pnpm install

# Push database schema
pnpm db:push

# Start development server
pnpm dev
```

## API Usage

### Image Optimization Endpoint

```
GET /api/v1/{projectSlug}/{operations}/{imageUrl}?key={publicKey}&sig={signature}&exp={expiry}
```

**URL Parameters:**

| Parameter | Description | Example |
|-----------|-------------|---------|
| `projectSlug` | Your project identifier | `my-blog` |
| `operations` | IPX operations (comma-separated) | `w_800,f_webp` |
| `imageUrl` | Source image URL (without protocol) | `cdn.example.com/photo.jpg` |

**Query Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `key` | Yes | Public key (e.g., `pk_abc123`) |
| `sig` | Yes | HMAC-SHA256 signature |
| `exp` | No | Expiration timestamp (Unix seconds) |

**Example:**

```
/api/v1/my-blog/w_800,f_webp/images.example.com/photo.jpg?key=pk_abc123&sig=xyz789
```

### Supported Operations

| Operation | Description | Example |
|-----------|-------------|---------|
| `w_{value}` | Width | `w_800` |
| `h_{value}` | Height | `h_600` |
| `s_{w}x{h}` | Size (width x height) | `s_200x200` |
| `f_{format}` | Format (webp, avif, png, jpg) | `f_webp` |
| `q_{value}` | Quality (1-100) | `q_80` |
| `embed` | Embed mode | `embed` |
| `_` | No operations (passthrough) | `_` |

### Generating Signatures

```typescript
import { createHmac } from "crypto";

function createUrlSignature(
  secretKey: string,
  path: string,
  expiresAt?: number
): string {
  const payload = expiresAt ? `${path}?exp=${expiresAt}` : path;
  const signature = createHmac("sha256", secretKey)
    .update(payload)
    .digest("base64url")
    .substring(0, 32);
  return signature;
}

// Usage
const secretKey = "sk_..."; // Your secret key
const path = "w_800,f_webp/cdn.example.com/photo.jpg";
const signature = createUrlSignature(secretKey, path);
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Auth pages (sign-in, sign-up)
│   ├── [team]/[project]/    # Dashboard pages
│   ├── api/
│   │   ├── trpc/            # tRPC endpoint
│   │   └── v1/              # Image optimization API
│   └── onboarding/          # User onboarding
├── modules/
│   ├── auth/                # Auth UI components
│   ├── onboarding/          # Onboarding flow
│   ├── project-detail/      # Project management UI
│   └── team/                # Team management UI
├── server/
│   ├── api/routers/         # tRPC routers (apiKey, project, team, usage)
│   ├── db/                  # Database schema and connection
│   └── lib/
│       ├── api-key.ts       # Key generation, encryption, signing
│       ├── ipx-factory.ts   # IPX instance management
│       ├── config-cache.ts  # Redis-backed config caching for API requests
│       ├── request-logger.ts # Request logging
│       └── validators.ts    # Domain and signature validation
└── lib/                     # Shared utilities
```

## Security Architecture

### Key Hierarchy

```
User (Clerk)
  └── Team (ownerId-based access control)
        └── Project (referer domain whitelist)
              └── API Key (source domain whitelist, signed URLs)
```

### Request Validation Flow

1. **API Key Validation** - Lookup by publicKey, check expiration and revocation
2. **Project Validation** - Verify project exists and slug matches the API key
3. **Signature Verification** - HMAC-SHA256 with timing-safe comparison
4. **Rate Limit Check** - Per-minute and per-day limits (only after signature is verified)
5. **Referer Validation** - Project-level domain whitelist
6. **Source Domain Validation** - API key-level domain whitelist
7. **Image Processing** - IPX transforms the image
8. **Response** - Optimized image with caching headers

### Encryption

- **Algorithm**: AES-256-GCM
- **Key Derivation**: HKDF (RFC 5869) with SHA-256
- **Storage Format**: `iv:authTag:ciphertext` (Base64 encoded)

## Documentation

### 👤 User Guide — 給 API 使用者

| Document | Description |
|----------|-------------|
| [Service Overview](./user-guide/getting-started/service-overview.md) | 產品概覽與功能介紹 |
| [Integration Guide](./user-guide/getting-started/integration-guide.md) | Step-by-step 整合教學 |
| [Authentication](./user-guide/reference/authentication.md) | 簽章認證與 URL 格式 |
| [Access Control](./user-guide/reference/access-control.md) | 權限模型與 Domain Whitelisting |
| [Caching Guide](./user-guide/reference/caching-guide.md) | HTTP 快取、Rate Limiting 與設定參考 |
| [Security](./user-guide/reference/security.md) | 安全機制說明 |

### 🔧 Internal — 給專案開發者

| Document | Description |
|----------|-------------|
| [System Overview](./internal/architecture/system-overview.md) | 系統架構總覽 |
| [Redis Schema](./internal/architecture/redis-schema.md) | Redis Key Schema 與實作細節 |
| [User Onboarding Flow](./internal/feature-flows/user-onboarding-flow.md) | Onboarding 流程與相關程式碼 |
| [Create API Key Flow](./internal/feature-flows/create-api-key-flow.md) | API Key 建立流程與實作 |
