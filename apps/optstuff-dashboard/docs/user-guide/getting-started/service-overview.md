# OptStuff Service Overview

OptStuff is a secure, high-performance image optimization API service designed for developers and teams who need to deliver optimized images at scale with fine-grained access control.

## What is OptStuff?

OptStuff provides an image optimization API that automatically resizes, compresses, and converts images on-the-fly. Simply point your image URLs through OptStuff's API endpoint, and we'll deliver optimized images with the right format, size, and quality for your use case.

## Key Features

### 1. Image Optimization API

Transform images dynamically with URL-based operations:

- **Resize**: Set width (`w_`), height (`h_`), or scale (`s_`)
- **Quality**: Adjust compression level (`q_`)
- **Format Conversion**: Convert to modern formats (`f_webp`, `f_avif`, `f_png`)
- **Fit Modes**: Control how images are resized (cover, contain, fill, etc.)

**Example URL:**
```text
/api/v1/{projectSlug}/w_800,q_80,f_webp/{imageUrl}?key={publicKey}&sig={signature}
```

### 2. Multi-Tenant Organization

Organize your resources with a flexible hierarchy:

- **Teams**: Top-level organizations (personal or shared)
- **Projects**: Isolated environments for different applications
- **API Keys**: Granular access credentials per project

### 3. Enterprise-Grade Security

Security is built into every layer:

- **Encrypted Storage**: API keys encrypted at rest using AES-256-GCM
- **URL Signing**: HMAC-SHA256 signatures prevent unauthorized usage
- **Domain Whitelisting**: Control which websites can use your API
- **Source Domain Control**: Restrict which image sources can be processed
- **Key Rotation**: Rotate keys without service interruption

### 4. Usage Analytics & Monitoring

Track and monitor your usage in real-time:

- Request counts and bandwidth consumption
- Daily and monthly usage summaries
- Per-API-key usage breakdown
- Recent request logs
- Top requested images
- Bandwidth savings metrics

### 5. Rate Limiting

Protect your account with configurable rate limits:

- Per-minute request limits (1–10,000)
- Per-day request limits (1–1,000,000)
- Automatic throttling for exceeded limits

## How It Works

### Request Flow

1. **Create a Project** – Set up a project in the dashboard
2. **Generate API Key** – Create an API key with your desired settings
3. **Sign URLs** – Use the secret key to sign image request URLs
4. **Make Requests** – Send signed requests to the OptStuff API
5. **Get Optimized Images** – Receive optimized images with caching headers

### Security Model

```text
User Authentication (Clerk)
    └── Team Access Control
        └── Project Settings
            └── Referer Domain Whitelist
                └── API Key
                    └── Source Domain Whitelist
                    └── Rate Limits
                    └── Expiration
```

## Pricing

### Free Plan

Get started at no cost with generous limits:

| Resource | Monthly Limit |
|----------|---------------|
| Requests | 10,000 |
| Bandwidth | 1 GB |

### Paid Plans

Upgrade for higher limits and additional features. Contact us for enterprise pricing.

## API Key Management

### Dual-Key System

Each API key consists of two parts:

- **Public Key** (`pk_xxx...`): Used in URLs to identify the key
- **Secret Key** (`sk_xxx...`): Used server-side to sign URLs (never exposed publicly)

### Key Lifecycle

1. **Generation**: Create new keys from the dashboard
2. **Configuration**: Set domain restrictions, rate limits, and expiration
3. **Usage**: Sign URLs with the secret key
4. **Rotation**: Generate new keys while preserving settings
5. **Revocation**: Disable compromised or unused keys

## Use Cases

### Web Applications

Optimize images for responsive websites:

- Serve appropriately sized images for different screen sizes
- Convert to modern formats (WebP, AVIF) for browsers that support them
- Reduce bandwidth costs and improve page load times

### Content Delivery

Integrate with your CDN for maximum performance:

- Cache optimized images at the edge
- Reduce origin server load
- Improve global delivery speeds

### E-commerce

Optimize product images at scale:

- Thumbnail generation
- Zoom-ready high-quality images
- Consistent image dimensions across your catalog

### User-Generated Content

Process user uploads efficiently:

- Resize to standard dimensions
- Compress for faster delivery
- Convert to web-friendly formats

## Technical Specifications

| Specification | Details |
|--------------|---------|
| Encryption | AES-256-GCM with HKDF key derivation |
| Signing | HMAC-SHA256 |
| Image Engine | IPX (powered by Sharp) |
| Supported Formats | JPEG, PNG, WebP, AVIF, GIF |
| Max Image Size | Configurable per plan |
| Caching | Aggressive cache headers for CDN compatibility |

## Getting Started

1. **Sign Up**: Create an account at the OptStuff dashboard
2. **Create a Team**: Set up your organization
3. **Create a Project**: Configure your first project
4. **Generate an API Key**: Get your credentials
5. **Integrate**: Follow the [Integration Guide](./integration-guide.md) to add OptStuff to your application

## Documentation

| Document | Description |
|----------|-------------|
| [Integration Guide](./integration-guide.md) | Step-by-step integration tutorial |
| [Authentication](../reference/authentication.md) | Request validation and error handling |
| [Access Control](../reference/access-control.md) | Multi-layer access control |
| [System Overview](../../internal/architecture/system-overview.md) | Technical architecture overview |
| [Security](../reference/security.md) | Security best practices and recommendations |

## Support

Need help? Check out our documentation or contact support through the dashboard.
