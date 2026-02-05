# Access Control & Permissions

This document describes the multi-layer permission architecture and configuration for the OptStuff image optimization service.

## Permission Hierarchy

OptStuff implements a four-layer permission model to provide fine-grained access control:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ Level 1: User Layer (Clerk Authentication)                              │
│                                                                         │
│ Controls: User login, identity verification                             │
│ Validation: Clerk session token                                         │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Level 2: Team Layer                                                     │
│                                                                         │
│ Controls: Who can manage resources under the Team                       │
│ Validation: team.ownerId === userId                                     │
│ Permissions: Only Team Owner can:                                       │
│              - Create/Delete Projects                                   │
│              - Manage API Keys                                          │
│              - View usage statistics                                    │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Level 3: Project Layer                                                  │
│                                                                         │
│ Controls: Which websites can use this Project's services                │
│ Setting: allowedRefererDomains                                          │
│ Validation: HTTP Referer header check                                   │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Level 4: API Key Layer                                                  │
│                                                                         │
│ Controls:                                                               │
│ - Which image sources can be optimized (allowedSourceDomains)           │
│ - Request rate limits (rateLimitPerMinute, rateLimitPerDay)             │
│ - Expiration date (expiresAt)                                           │
│                                                                         │
│ Validation:                                                             │
│ - HMAC-SHA256 signature                                                 │
│ - Source domain whitelist                                               │
│ - Expiration check                                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

## Permission Matrix

| Operation | Unauthenticated | Authenticated User | Team Owner |
|-----------|-----------------|-------------------|------------|
| View Team | ❌ | ❌ | ✅ |
| Create Project | ❌ | ❌ | ✅ |
| Delete Project | ❌ | ❌ | ✅ |
| Create API Key | ❌ | ❌ | ✅ |
| Revoke API Key | ❌ | ❌ | ✅ |
| View Usage Statistics | ❌ | ❌ | ✅ |
| Send Image Requests | ✅* | ✅* | ✅* |

\* Requires a valid API Key and signature

## Domain Whitelist Control

The system provides two layers of domain whitelisting, each serving different purposes:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    Domain Whitelist Architecture                        │
└─────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────────┐
                    │           Project Settings          │
                    │                                     │
                    │  allowedRefererDomains:             │
                    │  - example.com                      │
                    │  - *.example.com                    │
                    │                                     │
                    │  Purpose: Control which websites    │
                    │           can embed images          │
                    │  Validation: HTTP Referer header    │
                    └─────────────────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
     ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
     │    API Key 1     │ │    API Key 2     │ │    API Key 3     │
     │                  │ │                  │ │                  │
     │ allowedSource:   │ │ allowedSource:   │ │ allowedSource:   │
     │ - cdn.site-a.com │ │ - images.site-b  │ │ - mycdn.com      │
     │ - s3.aws.com     │ │                  │ │ - s3.amazonaws   │
     │                  │ │                  │ │                  │
     │ Purpose: Limit   │ │ Purpose: Process │ │ Purpose: Allow   │
     │ which image      │ │ only images from │ │ multiple trusted │
     │ sources this key │ │ specific sources  │ │ CDN sources      │
     │ can process      │ │                  │ │                  │
     └──────────────────┘ └──────────────────┘ └──────────────────┘
```

### Project Level: allowedRefererDomains

| Aspect | Description |
|--------|-------------|
| **Question** | Who can **use** this service? |
| **Validation** | HTTP Referer header |
| **Purpose** | Prevent other websites from hotlinking your images |
| **Example** | Add `myblog.com` to allow both myblog.com and all its subdomains |

### API Key Level: allowedSourceDomains

| Aspect | Description |
|--------|-------------|
| **Question** | Which **image sources** can be processed? |
| **Validation** | Image URL in the request |
| **Purpose** | Restrict processable image sources, prevent unauthorized image processing |
| **Example** | Only allow processing images from cdn.myblog.com |

### Practical Use Case

```text
Scenario: You have multiple websites, each using different image CDNs

┌─────────────────────────────────────────────────────────────────────────┐
│ Project: my-company                                                     │
│ allowedRefererDomains: [site-a.com, site-b.com, site-c.com]            │
│                                                                         │
│ API Key 1 (for site-a.com):                                            │
│   allowedSourceDomains: [cdn.site-a.com]                               │
│                                                                         │
│ API Key 2 (for site-b.com):                                            │
│   allowedSourceDomains: [images.site-b.com, s3.amazonaws.com]          │
│                                                                         │
│ API Key 3 (shared across sites):                                       │
│   allowedSourceDomains: [cdn.site-a.com, images.site-b.com,            │
│                          cdn.site-c.com, s3.amazonaws.com]             │
└─────────────────────────────────────────────────────────────────────────┘
```

## API Key Security Model

### Dual-Key System

Each API key consists of two parts:

| Key Type | Format | Usage | Security |
|----------|--------|-------|----------|
| **Public Key** | `pk_xxx...` | Used in URLs to identify the key | Safe to expose |
| **Secret Key** | `sk_xxx...` | Used server-side to sign URLs | **Never expose publicly** |

### Key Configuration Options

| Setting | Description | Default |
|---------|-------------|---------|
| `allowedSourceDomains` | Whitelist of image source domains | `null` (see note below) |
| `rateLimitPerMinute` | Maximum requests per minute | 60 |
| `rateLimitPerDay` | Maximum requests per day | 10,000 |
| `expiresAt` | Key expiration date | None |

> **Note on `allowedSourceDomains`**: When set to `null` or empty:
> - **Production**: All requests are rejected (fail closed for security)
> - **Development**: All sources are allowed (for local testing convenience)

### URL Signature

All image requests must be signed with the secret key using HMAC-SHA256:

```text
Request URL structure:
/api/v1/{projectSlug}/{operations}/{imageUrl}?key={keyPrefix}&sig={signature}&exp={expiration}

Signature calculation:
payload = exp ? "{operations}/{imageUrl}?exp={exp}" : "{operations}/{imageUrl}"
signature = HMAC-SHA256(secretKey, payload).substring(0, 32)
```

## Rate Limiting

Rate limits can be configured at the API Key level:

| Limit Type | Range | Default | Description |
|------------|-------|---------|-------------|
| Per-minute | 1–10,000 | 60 | Requests allowed per rolling minute |
| Per-day | 1–1,000,000 | 10,000 | Requests allowed per calendar day |

> **Note**: Rate limit enforcement is configured per API key but the actual enforcement mechanism may vary based on deployment configuration.

## Configuring Domain Whitelists

### Setting Project allowedRefererDomains

1. Navigate to Dashboard → Select Project
2. Click "Settings"
3. In "Allowed Referer Domains", add domain names
4. Subdomain matching: Adding `example.com` will automatically allow `example.com` and all subdomains like `www.example.com`, `cdn.example.com`, etc.

### Setting API Key allowedSourceDomains

1. Navigate to Dashboard → Select Project → API Keys
2. Click the API Key to edit
3. In "Allowed Source Domains", add domain names
4. Subdomain matching: `example.com` will also match `cdn.example.com`, `images.example.com`, etc.

> **Important**: In production, an empty allowedSourceDomains list will reject all requests for security. Always configure at least one allowed domain for production use.

## Security Best Practices

### Key Management

| Recommendation | Description |
|----------------|-------------|
| Minimum privilege | Each API Key should only allow necessary source domains |
| Set expiration | Configure reasonable expiration dates for API Keys |
| Regular rotation | Rotate API Keys periodically (recommended: every 90 days) |
| Immediate revocation | Revoke compromised keys immediately |

### Request Security

| Recommendation | Description |
|----------------|-------------|
| Use HTTPS | All requests must be over HTTPS |
| Sign expiration | Set reasonable `exp` parameter to prevent replay attacks |
| Server-side signing | URL signatures must be generated server-side |
| Protect secretKey | Never expose secretKey in frontend code |

### Recommended Signature Expiration Times

| Use Case | Recommended Expiration |
|----------|----------------------|
| Static page images | 24 hours (86400 seconds) |
| Dynamic content images | 1 hour (3600 seconds) |
| Temporary share links | 15 minutes (900 seconds) |
| Testing purposes | 5 minutes (300 seconds) |

## Error Responses

| HTTP Status | Error | Cause |
|-------------|-------|-------|
| 400 | Invalid path format | Malformed request URL structure |
| 400 | Invalid image URL | Unable to parse the image URL |
| 401 | Missing signature parameters | `key` or `sig` parameter not provided |
| 401 | Invalid API key | API key not found or does not belong to project |
| 401 | API key has expired | Key past its expiresAt date |
| 403 | Invalid or expired signature | Signature mismatch or expired |
| 403 | Source domain not allowed | Image source not in allowedSourceDomains |
| 403 | Invalid referer | Request referer not in allowedRefererDomains |
| 404 | Project not found | Project slug does not exist |
| 500 | Image processing failed | Internal error during image optimization |

## Attack Protection

| Attack Type | Protection Mechanism | Description |
|-------------|---------------------|-------------|
| Brute force | HMAC-SHA256 + 32-char output | Computationally infeasible |
| Replay attacks | `exp` expiration | Signatures have time limits |
| Timing attacks | `timingSafeEqual` constant-time comparison | Cannot infer from timing differences |
| Data theft | AES-256-GCM encrypted storage | Database leaks don't expose keys |
| Man-in-the-middle | HTTPS + signature validation | Dual protection |

## Related Documentation

- [Service Overview](../service-overview.md) - Complete service overview
- [Integration Guide](../service/integration-guide.md) - Step-by-step integration tutorial
- [Authentication](../service/authentication.md) - Request validation and error handling
- [Security](../security-qa/security.md) - Detailed security recommendations
