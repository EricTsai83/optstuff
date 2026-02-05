# Security at OptStuff

This document explains the security measures we've implemented to protect your data and prevent unauthorized access to your image optimization service.

## Our Security Philosophy: Defense in Depth

We believe security is not a single feature but a layered approach. Even if one layer is compromised, multiple additional barriers protect your assets. This document outlines each layer and what it defends against.

---

## 1. Encrypted Storage

### What We Protect Against
**Database breaches** — If an attacker gains access to our database, they cannot immediately use your API keys.

### How We Do It

| Measure | Implementation |
|---------|----------------|
| **Encryption Algorithm** | AES-256-GCM (industry standard, used by governments) |
| **Key Derivation** | HKDF (RFC 5869) with SHA-256 |
| **Encryption Key Storage** | Stored separately in environment variables, not in the database |

```text
Without Encryption:
┌──────────────┐     Database Breach     ┌──────────────┐
│   Database   │ ──────────────────────→ │ Plain Keys   │ → Immediate misuse
│ sk_abc123... │                         │ sk_abc123... │
└──────────────┘                         └──────────────┘

With Our Encryption:
┌──────────────┐     Database Breach     ┌──────────────┐
│   Database   │ ──────────────────────→ │ Encrypted    │ → Useless without
│ iv:tag:cipher│                         │ Gibberish    │   master key
└──────────────┘                         └──────────────┘
```

**Why HKDF instead of simple hashing?**
- Allows secure derivation of multiple keys from one master secret
- Supports key versioning for seamless rotation
- Follows cryptographic best practices (RFC 5869)

---

## 2. Request Signing (HMAC-SHA256)

### What We Protect Against
**Unauthorized usage** — Prevents anyone without your secret key from using your image optimization service.

### How We Do It

Every image request must include a cryptographic signature generated with your secret key:

```text
Request URL:
/api/v1/my-blog/w_800/cdn.example.com/photo.jpg?key=pk_xxx&sig=abc123

Server Verification:
1. Look up the secretKey using keyPrefix
2. Recalculate: expectedSig = HMAC-SHA256(secretKey, path)
3. Compare signatures using constant-time comparison
4. Reject if mismatch
```

| Security Property | Benefit |
|-------------------|---------|
| **One-way function** | Signature cannot be reversed to obtain secretKey |
| **32-character output** | Brute force is computationally infeasible |
| **Constant-time comparison** | Prevents timing attacks |

---

## 3. Signature Expiration

### What We Protect Against
**Replay attacks** — Prevents attackers from capturing and reusing valid signed URLs indefinitely.

### How We Do It

Signatures include an optional expiration timestamp (`exp` parameter):

```text
Signed URL with expiration:
/api/v1/my-blog/w_800/photo.jpg?key=pk_xxx&sig=abc&exp=1699999999
                                                    └── Unix timestamp

Server checks:
1. Verify signature includes the exp value
2. Reject if current time > exp
```

| Use Case | Recommended Expiration |
|----------|----------------------|
| Static page images | 24 hours |
| Dynamic content | 1 hour |
| Temporary share links | 15 minutes |
| Testing | 5 minutes |

---

## 4. Two-Layer Domain Whitelisting

### What We Protect Against
**Hotlinking & abuse** — Prevents unauthorized websites from embedding your optimized images and prevents your service from being used to process arbitrary images.

### How We Do It

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 1: Project-Level — allowedRefererDomains                          │
│                                                                         │
│ Question: WHO can use this service?                                     │
│ Validation: HTTP Referer header                                         │
│ Protection: Blocks other websites from embedding your images            │
│                                                                         │
│ Example: Only myblog.com and *.myblog.com can display your images       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 2: API Key-Level — allowedSourceDomains                           │
│                                                                         │
│ Question: WHAT image sources can be processed?                          │
│ Validation: Image URL in the request                                    │
│ Protection: Prevents your service from processing unauthorized images   │
│                                                                         │
│ Example: Only process images from cdn.myblog.com                        │
└─────────────────────────────────────────────────────────────────────────┘
```

**Why two layers?**
- **Separation of concerns**: Control who uses vs. what gets processed
- **Granular permissions**: Different API keys can have different source restrictions
- **Principle of least privilege**: Each key only allows what's necessary

---

## 5. Rate Limiting

### What We Protect Against
**Resource exhaustion & abuse** — Prevents attackers or misbehaving clients from overwhelming the service or generating unexpected costs.

### How We Do It

| Limit Type | Configurable Range | Default |
|------------|-------------------|---------|
| Per-minute | 1 – 10,000 | 60 requests |
| Per-day | 1 – 1,000,000 | 10,000 requests |

Each API key has its own rate limits, allowing you to:
- Create restricted keys for testing
- Set generous limits for production
- Immediately identify which key is causing issues

---

## 6. Dual-Key System

### What We Protect Against
**Accidental exposure** — Separates public-safe identifiers from sensitive secrets.

### How We Do It

| Key | Format | Purpose | Safe to Expose? |
|-----|--------|---------|-----------------|
| **Public Key** | `pk_xxx...` | Identifies requests | ✅ Yes |
| **Secret Key** | `sk_xxx...` | Signs URLs | ❌ Never |
| **Key Prefix** | `pk_xxxxxxxx` | Database lookup & display | ✅ Yes |

- Public key appears in URLs (necessary for request identification)
- Secret key stays on your server (generates signatures)
- Even if someone sees your URL, they cannot forge new requests without the secret key

---

## 7. Four-Layer Permission Model

### What We Protect Against
**Unauthorized access at every level** — Ensures users, teams, projects, and API keys each have appropriate access controls.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ Level 1: User Authentication (Clerk)                                    │
│ → Verifies user identity before any dashboard access                    │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Level 2: Team Ownership                                                 │
│ → Only team owners can manage resources                                 │
│ → Prevents unauthorized team members from creating/deleting keys        │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Level 3: Project Settings                                               │
│ → Referer domain restrictions at the project level                      │
│ → Isolates different applications within a team                         │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Level 4: API Key Controls                                               │
│ → Source domain restrictions                                            │
│ → Rate limits                                                           │
│ → Expiration dates                                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Attack Protection Summary

| Attack Type | Our Protection | How It Works |
|-------------|----------------|--------------|
| **Brute Force** | HMAC-SHA256 + 32-char signature | Computationally infeasible to guess |
| **Replay Attacks** | Signature expiration (`exp` param) | Old signatures automatically rejected |
| **Timing Attacks** | `timingSafeEqual` comparison | Cannot infer secrets from response time |
| **Database Breach** | AES-256-GCM encryption | Encrypted keys useless without master key |
| **Man-in-the-Middle** | HTTPS + signature validation | Dual protection layer |
| **Hotlinking** | Referer domain whitelist | Only your websites can use images |
| **Unauthorized Sources** | Source domain whitelist | Only approved CDNs can be processed |
| **Resource Exhaustion** | Per-key rate limiting | Abuse isolated and contained |

---

## 9. Secure Defaults

We follow the principle of **"fail closed"** for security-sensitive configurations:

| Setting | Behavior When Empty/Unset |
|---------|---------------------------|
| `allowedSourceDomains` | **Production**: Reject all requests |
| `allowedRefererDomains` | Requests without referer may be blocked |
| API Key expiration | Configurable; we recommend setting expiration |

---

## 10. Best Practices We Recommend

### API Key Management

| Practice | Why It Matters |
|----------|----------------|
| **Set expiration dates** | Limits damage window if key is compromised |
| **Rotate keys every 90 days** | Reduces long-term exposure risk |
| **Use separate keys per environment** | Isolates production from development |
| **Restrict source domains** | Principle of least privilege |
| **Revoke compromised keys immediately** | Stop unauthorized access instantly |

### URL Signing

| Practice | Why It Matters |
|----------|----------------|
| **Sign URLs server-side only** | Secret key never exposed to browsers |
| **Use short expiration for dynamic content** | Minimizes replay window |
| **Always use HTTPS** | Prevents signature interception |

---

## Technical Standards We Follow

| Standard | Usage |
|----------|-------|
| **AES-256-GCM** | Authenticated encryption for stored keys |
| **HKDF (RFC 5869)** | Cryptographic key derivation |
| **HMAC-SHA256** | URL signature generation |
| **Constant-time comparison** | Timing-safe signature verification |

---

## Summary

OptStuff is built with security as a foundational principle, not an afterthought. Our multi-layer approach ensures:

1. **Your API keys are encrypted** — Database breaches don't expose usable keys
2. **Every request is signed** — No one can forge requests without your secret
3. **Signatures can expire** — Replay attacks are mitigated
4. **Domains are whitelisted** — Only authorized websites and sources are allowed
5. **Rate limits are enforced** — Abuse is contained and identifiable
6. **Permissions are layered** — Access control at every level

We continuously review and improve our security measures. If you have questions or concerns, please contact our team.

---

## Related Documentation

- [Access Control & Permissions](../system-design/access-control.md) — Detailed permission architecture
- [Integration Guide](../service/integration-guide.md) — How to securely integrate the service
