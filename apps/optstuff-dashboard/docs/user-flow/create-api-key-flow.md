# Create API Key Flow

This document explains the API key creation flow in OptStuff Dashboard.

## Overview

Users create API keys to authenticate image transformation requests. Each API key consists of a **key prefix** (for identification) and a **secret key** (for URL signing). The secret key is only shown once at creation time.

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CREATE API KEY FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────────┐
                              │  User clicks     │
                              │  "Create API Key"│
                              └────────┬─────────┘
                                       │
                                       ▼
                              ┌──────────────────┐
                              │  Dialog opens    │
                              │  (Form Step)     │
                              └────────┬─────────┘
                                       │
                                       ▼
                      ┌────────────────────────────────┐
                      │  User enters:                  │
                      │  - Key name                    │
                      │  - Allowed source domains      │
                      │  - Expiration (optional)       │
                      └────────────────┬───────────────┘
                                       │
                                       ▼
                      ┌────────────────────────────────┐
                      │  Validate form inputs          │
                      │  - Name required               │
                      │  - At least 1 domain required  │
                      └────────────────┬───────────────┘
                                       │
                                       ▼
                              ┌──────────────────┐
                              │  Submit to       │
                              │  Backend API     │
                              └────────┬─────────┘
                                       │
           ┌───────────────────────────┴───────────────────────────┐
           │                                                       │
           ▼                                                       ▼
┌─────────────────────┐                              ┌─────────────────────┐
│  generateApiKey()   │                              │  Error Response     │
│                     │                              │                     │
│  Generate:          │                              │  Show error toast   │
│  - key (pk_xxx)     │                              │  User can retry     │
│  - keyPrefix        │                              │                     │
│  - secretKey (sk_xx)│                              └─────────────────────┘
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  encryptApiKey()    │
│                     │
│  Encrypt:           │
│  - keyFull          │
│  - secretKey        │
│  (AES-256-GCM)      │
└──────────┬──────────┘
           │
           ├──────────────────────────────────┐
           ▼                                  ▼
┌─────────────────────┐            ┌─────────────────────┐
│  Store in Database  │            │  Return to Client   │
│                     │            │                     │
│  - id               │            │  - key (plaintext)  │
│  - name             │            │  - secretKey        │
│  - keyPrefix        │            │    (plaintext)      │
│    (plaintext)      │            │                     │
│  - keyFull          │            │  ⚠️ Only shown once │
│    (encrypted)      │            └──────────┬──────────┘
│  - secretKey        │                       │
│    (encrypted)      │                       ▼
│  - allowedDomains   │            ┌─────────────────────┐
│  - expiresAt        │            │  Dialog switches    │
└─────────────────────┘            │  to Success Step    │
                                   └──────────┬──────────┘
                                              │
                                              ▼
                                   ┌─────────────────────┐
                                   │  Display:           │
                                   │  - Secret Key       │
                                   │  - Key Prefix       │
                                   │  - Usage Example    │
                                   │                     │
                                   │  Copy buttons for   │
                                   │  easy copying       │
                                   └──────────┬──────────┘
                                              │
                                              ▼
                                   ┌─────────────────────┐
                                   │  User clicks "Done" │
                                   │  Dialog closes      │
                                   │  List refreshes     │
                                   └─────────────────────┘
```

## Key Concepts

### API Key Structure

| Component | Format | Description |
|-----------|--------|-------------|
| Key | `pk_` + 32 bytes (base64url) | Full API key, stored encrypted |
| Key Prefix | First 12 chars of key | Used in URL for identification (e.g., `pk_wGqLzy...`) |
| Secret Key | `sk_` + 32 bytes (base64url) | Used for HMAC-SHA256 URL signing |

### Encryption

| Aspect | Details |
|--------|---------|
| Algorithm | AES-256-GCM (authenticated encryption) |
| Key Derivation | HKDF (RFC 5869) from master secret |
| Storage | Only `keyFull` and `secretKey` are encrypted |
| `keyPrefix` | Stored in plaintext for database lookup |

### Form Fields

| Field | Required | Description |
|-------|----------|-------------|
| Key Name | Yes | Descriptive name (e.g., "Production", "Development") |
| Allowed Source Domains | Yes | Which image sources this key can access |
| Expiration | No | Optional expiry date for automatic key invalidation |

## User Journey

### 1. Open Create Dialog

User navigates to a project's API Keys section and clicks the **"Create API Key"** button.

### 2. Fill Out Form

The dialog presents a form with:

1. **Key Name** — Input field for a descriptive name
2. **Allowed Source Domains** — Domain list input with add/remove functionality
3. **Expiration** — Select dropdown with preset options (30 days, 90 days, etc.)

### 3. Submit Form

When the user clicks "Create Key":

1. Frontend validates inputs (name required, at least 1 domain)
2. Sends request to `apiKey.create` tRPC mutation
3. Button shows loading state during request

### 4. Backend Processing

The backend:

1. Generates cryptographically secure key and secretKey
2. Encrypts both using AES-256-GCM
3. Stores encrypted values in database
4. Returns plaintext key and secretKey to client

### 5. Success Screen

Dialog transitions to success view showing:

1. **Secret Key** — Full secret key with copy button and warning
2. **Key Prefix** — Shortened key for URL parameter
3. **Usage Example** — Code snippet showing how to sign URLs

> ⚠️ **Important**: The secret key is only shown once. Users must copy and save it securely.

### 6. Complete

User clicks "Done" to close the dialog. The API key list automatically refreshes to show the new key.

## Error Scenarios

| Scenario | Behavior |
|----------|----------|
| Empty key name | Submit button disabled |
| No source domains | Submit button disabled |
| Network error | Show error toast, user can retry |
| Server error | Show error toast with message |
| Duplicate name | Show validation error (if enforced) |

## Form Validation Rules

| Field | Validation |
|-------|------------|
| Key Name | Required, non-empty after trim |
| Source Domains | At least 1 domain required |
| Expiration | Optional, must be future date if set |

## Related Files

| File | Purpose |
|------|---------|
| `src/modules/project-detail/ui/components/create-api-key-dialog.tsx` | Dialog component with form and success states |
| `src/modules/project-detail/ui/components/domain-list-input.tsx` | Domain input component |
| `src/modules/project-detail/ui/components/expiration-select.tsx` | Expiration dropdown component |
| `src/server/lib/api-key.ts` | Key generation and encryption functions |
| `src/server/api/routers/api-key.ts` | Backend tRPC router for API key operations |
| `src/modules/project-detail/ui/components/api-key-types.ts` | TypeScript types for API key data |

## Database Schema

The `api_keys` table stores:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `projectId` | UUID | Foreign key to projects table |
| `name` | String | User-defined key name |
| `keyPrefix` | String | First 12 chars (plaintext, indexed) |
| `keyFull` | String | Full key (AES-256-GCM encrypted) |
| `secretKey` | String | Secret key (AES-256-GCM encrypted) |
| `allowedSourceDomains` | String[] | Allowed image source domains |
| `expiresAt` | Timestamp | Optional expiration date |
| `createdAt` | Timestamp | Creation timestamp |
| `lastUsedAt` | Timestamp | Last usage timestamp |
| `revokedAt` | Timestamp | Revocation timestamp (null if active) |

## Security Considerations

1. **Secret Key Display** — Only shown once at creation, never retrievable again
2. **Encryption at Rest** — Keys encrypted using HKDF-derived AES-256-GCM
3. **Domain Restrictions** — Keys are scoped to specific source domains
4. **Expiration** — Optional automatic key invalidation
5. **Audit Trail** — `createdAt`, `lastUsedAt`, `revokedAt` timestamps

---

## Related Documentation

- [API Key Lifecycle](./api-key-lifecycle.md) — Full lifecycle from creation to revocation
- [Authentication](./authentication.md) — Request authentication flow
- [Security Best Practices](./security-best-practices.md) — Key management recommendations
- [Service Overview](./service-overview.md) — System architecture overview
