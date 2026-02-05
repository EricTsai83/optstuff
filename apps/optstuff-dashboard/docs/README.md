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
GET /api/v1/{projectSlug}/{operations}/{imageUrl}?key={keyPrefix}&sig={signature}&exp={expiry}
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
| `key` | Yes | API key prefix (e.g., `pk_abc123`) |
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
│       ├── project-cache.ts # In-memory caching
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

1. **Project Lookup** - Validate project exists
2. **Signature Verification** - HMAC-SHA256 with timing-safe comparison
3. **API Key Validation** - Check expiration and revocation status
4. **Referer Validation** - Project-level domain whitelist
5. **Source Domain Validation** - API key-level domain whitelist
6. **Image Processing** - IPX transforms the image
7. **Response** - Optimized image with caching headers

### Encryption

- **Algorithm**: AES-256-GCM
- **Key Derivation**: HKDF (RFC 5869) with SHA-256
- **Storage Format**: `iv:authTag:ciphertext` (Base64 encoded)

## Documentation

| Document | Description |
|----------|-------------|
| [Service Overview](./service-overview.md) | Product-focused service description |
| [System Overview](./system-design/system-overview.md) | Technical architecture deep-dive |
| [Access Control](./system-design/access-control.md) | Permission model explained |
| [Authentication](./service/authentication.md) | Request validation details |
| [Integration Guide](./service/integration-guide.md) | Step-by-step integration |
| [User Onboarding](./user-flow/user-onboarding.md) | Onboarding flow walkthrough |
| [Security Q&A](./security-qa/security.md) | Security measures explained |
