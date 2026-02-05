# OptStuff System Overview

This document provides a comprehensive technical overview of the OptStuff image optimization service, covering its architecture, security model, and core components.

## Introduction

OptStuff is an enterprise-grade image optimization API service that enables developers and teams to deliver optimized images at scale. The system provides on-the-fly image transformation with fine-grained access control, robust security mechanisms, and multi-tenant support.

### Core Value Proposition

- **On-Demand Optimization**: Transform images dynamically via URL parameters
- **Enterprise Security**: Multi-layer authentication and encryption
- **Multi-Tenant Architecture**: Teams, projects, and API keys hierarchy
- **Usage Analytics**: Real-time monitoring and bandwidth tracking
- **CDN-Friendly**: Aggressive caching headers for edge deployment

## System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                   │
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                      │
│  │   Team A    │    │   Team B    │    │   Team C    │                      │
│  │  (Owner)    │    │  (Owner)    │    │  (Owner)    │                      │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                      │
│         │                  │                  │                             │
│  ┌──────┴──────┐    ┌──────┴──────┐    ┌──────┴──────┐                      │
│  │  Project 1  │    │  Project 3  │    │  Project 5  │                      │
│  │  Project 2  │    │  Project 4  │    │             │                      │
│  └──────┬──────┘    └─────────────┘    └─────────────┘                      │
│         │                                                                   │
│  ┌──────┴──────┐                                                            │
│  │  API Keys   │                                                            │
│  └─────────────┘                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            API GATEWAY                                      │
│                                                                             │
│  Endpoint: /api/v1/{projectSlug}/{operations}/{imageUrl}                    │
│  Query Params: ?key={keyPrefix}&sig={signature}&exp={expiration}             │
│                                                                             │
│  Validation Pipeline:                                                       │
│  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐           │
│  │Project│→ │API Key│→ │ Sig   │→ │Referer│→ │Source │→ │ Rate  │           │
│  │Exists │  │Valid  │  │Verify │  │Domain │  │Domain │  │Limit  │           │
│  └───────┘  └───────┘  └───────┘  └───────┘  └───────┘  └───────┘           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        IMAGE PROCESSING ENGINE                              │
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐          │
│  │  IPX (Sharp)    │    │  Format Conv.   │    │  Cache Layer    │          │
│  │  - Resize       │    │  - WebP         │    │  - CDN Headers  │          │
│  │  - Crop         │    │  - AVIF         │    │  - ETag         │          │
│  │  - Quality      │    │  - PNG/JPEG     │    │  - Cache-Control│          │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Multi-Tenant Resource Hierarchy

The system implements a three-level hierarchy for resource organization:

| Level | Entity | Description |
|-------|--------|-------------|
| 1 | **Team** | Top-level organization unit (personal or shared workspace) |
| 2 | **Project** | Isolated environment within a team for different applications |
| 3 | **API Key** | Granular access credential bound to a specific project |

### 2. Authentication System

User authentication is handled by **Clerk**, providing:

- Social login (Google, GitHub, etc.)
- Email/password authentication
- Session management
- User identity verification

### 3. API Key Management

Each API key consists of a dual-key system:

| Key Type | Format | Purpose | Visibility |
|----------|--------|---------|------------|
| Public Key | `pk_<43 base64url chars>` | Request identification | Safe to expose in URLs |
| Secret Key | `sk_<43 base64url chars>` | URL signature generation | **Must be kept secret** |
| Key Prefix | `pk_<8 chars>` | Quick lookup and display | Stored in plaintext |

### 4. Image Processing Engine

Built on **IPX** (powered by **Sharp**), the engine supports:

| Operation | Parameter | Example |
|-----------|-----------|---------|
| Width | `w_` | `w_800` |
| Height | `h_` | `h_600` |
| Quality | `q_` | `q_80` |
| Format | `f_` | `f_webp`, `f_avif` |
| Fit | `fit_` | `fit_cover`, `fit_contain` |
| Scale | `s_` | `s_0.5` |

### 5. Usage Analytics

Real-time tracking and monitoring includes:

- Request counts (per minute, daily, monthly)
- Bandwidth consumption
- Per-API-key usage breakdown
- Recent request logs
- Top requested images
- Bandwidth savings metrics

## Security Architecture

### Three-Tier Key Hierarchy

```text
Level 0: System Key (Environment Variable)
┌─────────────────────────────────────────────────────────────────────────────┐
│  API_KEY_ENCRYPTION_SECRET                                                  │
│  Purpose: Encrypt/decrypt all sensitive data in database                    │
│  Scope: System-wide singleton                                               │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │ Protects
                                ▼
Level 1: API Key Secrets (Per API Key)
┌─────────────────────────────────────────────────────────────────────────────┐
│  keyFull (pk_xxx)          │ secretKey (sk_xxx)                             │
│  Purpose: Identify API Key │ Purpose: Generate/verify URL signatures        │
│  Exposure: Can be known    │ Exposure: Must remain confidential              │
└────────────────────────────┴────────────────────────────────────────────────┘
                                │ Used for
                                ▼
Level 2: Request Signatures (Per Request)
┌─────────────────────────────────────────────────────────────────────────────┐
│  signature (sig)                                                            │
│  Purpose: Prove possession of secretKey                                     │
│  Property: One-way hash, cannot reverse to secretKey                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Encryption Mechanisms

| Mechanism | Algorithm | Purpose |
|-----------|-----------|---------|
| Key Derivation | HKDF (RFC 5869) with SHA-256 | Derive encryption key from master secret |
| Data Encryption | AES-256-GCM | Encrypt API keys at rest |
| URL Signing | HMAC-SHA256 | Sign image request URLs |
| Signature Comparison | `timingSafeEqual` | Prevent timing attacks |

### Four-Layer Permission Model

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Level 1: User Layer (Clerk Authentication)                                  │
│ → User login and identity verification                                      │
└─────────────────────────────┬───────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Level 2: Team Layer                                                         │
│ → Resource ownership: team.ownerId === userId                               │
│ → Permissions: Create/delete projects, manage API keys, view stats          │
└─────────────────────────────┬───────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Level 3: Project Layer                                                      │
│ → allowedRefererDomains: Control which websites can use the service         │
│ → Validation: HTTP Referer header check                                     │
└─────────────────────────────┬───────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Level 4: API Key Layer                                                      │
│ → allowedSourceDomains: Restrict image sources                              │
│ → Rate limits: rateLimitPerMinute, rateLimitPerDay                         │
│ → Expiration: expiresAt                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Domain Whitelist Architecture

| Layer | Setting | Question Answered | Validation Method |
|-------|---------|-------------------|-------------------|
| Project | `allowedRefererDomains` | Who can **use** this service? | HTTP Referer header |
| API Key | `allowedSourceDomains` | Which **image sources** can be processed? | Image URL in request |

## Request Flow

### Image Request Lifecycle

```text
1. Client Preparation
   ┌─────────────────────────────────────────────────────────────────────────┐
   │ path = "w_800,f_webp/images.example.com/photo.jpg"                      │
   │ sig = HMAC-SHA256(secretKey, path)                                      │
   │ url = /api/v1/{slug}/{path}?key={keyPrefix}&sig={sig}&exp={exp}          │
   └─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
2. Server Validation
   ┌─────────────────────────────────────────────────────────────────────────┐
   │ a. Parse URL parameters (keyPrefix, signature)                           │
   │ b. Lookup API Key by keyPrefix                                           │
   │ c. Decrypt secretKey from database                                      │
   │ d. Verify signature: HMAC-SHA256(secretKey, path) === signature         │
   │ e. Validate expiration, referer domain, source domain                   │
   │ f. Check rate limits                                                    │
   └─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
3. Image Processing
   ┌─────────────────────────────────────────────────────────────────────────┐
   │ a. Fetch source image                                                   │
   │ b. Apply transformations (resize, format, quality)                      │
   │ c. Set cache headers                                                    │
   │ d. Return optimized image                                               │
   └─────────────────────────────────────────────────────────────────────────┘
```

### API Key Lifecycle

| Phase | Actions |
|-------|---------|
| **Creation** | Generate key pair → Encrypt → Store in DB → Return to user (once) |
| **Usage** | Sign URLs with secretKey → Server validates signature |
| **Rotation** | Revoke old key → Create new key (inherits settings) → Update application |
| **Revocation** | Mark as revoked → Clear cache → Reject future requests |

## Rate Limiting

| Limit Type | Range | Default | Description |
|------------|-------|---------|-------------|
| Per-minute | 1–10,000 | 60 | Rolling window rate limit |
| Per-day | 1–1,000,000 | 10,000 | Calendar day limit |

## Technical Specifications

| Specification | Details |
|---------------|---------|
| Encryption | AES-256-GCM with HKDF key derivation |
| Signing | HMAC-SHA256 (32-character output) |
| Image Engine | IPX (powered by Sharp) |
| Supported Input Formats | JPEG, PNG, WebP, AVIF, GIF |
| Supported Output Formats | JPEG, PNG, WebP, AVIF |
| Authentication Provider | Clerk |
| Database | PostgreSQL (via Prisma ORM) |
| Framework | Next.js (App Router) |

## Attack Protections

| Attack Type | Protection Mechanism |
|-------------|---------------------|
| Brute force | HMAC-SHA256 + 32-char output makes collision computationally infeasible |
| Replay attacks | `exp` expiration parameter limits signature validity |
| Timing attacks | `timingSafeEqual` constant-time comparison |
| Data theft | AES-256-GCM encrypted storage protects database leaks |
| Man-in-the-middle | HTTPS + signature validation provides dual protection |
| Hotlinking | Referer domain whitelist prevents unauthorized embedding |
| Unauthorized sources | Source domain whitelist restricts image origins |

## Error Handling

| HTTP Status | Error | Cause |
|-------------|-------|-------|
| 400 | Invalid path format | Malformed request URL structure |
| 400 | Invalid image URL | Unable to parse the image URL |
| 401 | Missing signature parameters | `key` or `sig` parameter not provided |
| 401 | Invalid API key | API key not found or does not belong to project |
| 401 | API key has expired | Key past its `expiresAt` date |
| 403 | Invalid or expired signature | Signature mismatch or expired |
| 403 | Source domain not allowed | Image source not in allowedSourceDomains |
| 403 | Invalid referer | Request referer not in allowedRefererDomains |
| 404 | Project not found | Project slug does not exist |
| 429 | Rate limit exceeded | Request count exceeded configured limits |
| 500 | Image processing failed | Internal error during image optimization |

## Related Documentation

| Document | Description |
|----------|-------------|
| [Service Overview](../service-overview.md) | Product-focused service description |
| [Access Control](./access-control.md) | Multi-layer permission architecture |
| [Integration Guide](../service/integration-guide.md) | Step-by-step integration tutorial |
| [Authentication](../service/authentication.md) | Request validation and error handling |
| [Security](../security-qa/security.md) | Security best practices and recommendations |
