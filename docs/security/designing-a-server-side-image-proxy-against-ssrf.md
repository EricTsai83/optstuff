# Designing a Server-Side Image Proxy That Doesn't Become an SSRF Gateway

When you design a service that fetches external resources on behalf of users, you're building a proxy — whether you intend to or not. Every proxy is one misconfiguration away from being an open gateway into your private network. This article walks through the system design of a real image optimization API, shows how a seemingly correct architecture left a gap that enables Server-Side Request Forgery (SSRF), and explains the design principle we applied to close it.

---

## The System: An Image Optimization API

The service accepts a signed URL containing an image address and a set of transformation operations (resize, format conversion, etc.), fetches the original image from the internet, processes it, and returns the optimized result.

At a high level, the architecture has three layers:

```text
┌─────────────────────────────────────────────────────┐
│                   API Gateway Layer                  │
│   Authentication · Rate Limiting · Input Validation  │
├─────────────────────────────────────────────────────┤
│                  Validation Layer                    │
│     Referer check · Source domain allowlist check    │
├─────────────────────────────────────────────────────┤
│                  Processing Layer                    │
│       IPX image engine (fetch + transform)          │
│              ↓ HTTP request to origin ↓              │
└─────────────────────────────────────────────────────┘
                        │
                   ┌────▼────┐
                   │ Internet │
                   └─────────┘
```

The **API Gateway Layer** verifies the cryptographic signature, checks whether the API key is valid and not revoked, and enforces rate limits.

The **Validation Layer** ensures the requested image URL belongs to a domain on the API key's allowlist (`allowedSourceDomains`). This is the security boundary — it decides which external hosts the server is willing to contact.

The **Processing Layer** is a third-party library (IPX) that receives a URL and a set of operations, fetches the image over HTTP, runs the transformations, and returns raw bytes.

This separation of concerns looks clean. Each layer has a single responsibility. But there is a critical design flaw hiding in the boundary between the Validation Layer and the Processing Layer.

---

## The Design Flaw: Validation and Execution Operate on Different URLs

The Validation Layer inspects the URL as the client submitted it:

```typescript
const sourceHost = new URL(imageUrl).hostname;  // "cdn.example.com"

if (!validateSourceDomain(sourceHost, apiKey.allowedSourceDomains)) {
  return error(403, "Source domain not allowed");
}
```

The Processing Layer then hands that same URL to IPX, which calls `fetch()` internally:

```typescript
const ipx = getProjectIPX();
const result = await ipx(imageUrl, operations).process();
```

Here is the problem. The Validation Layer and the Processing Layer both receive the same input string — `imageUrl` — but the Processing Layer does not necessarily make a request to the host in that string. HTTP has a built-in mechanism for servers to say "the resource you want is actually over here": **redirects** (`301`, `302`, `307`, `308`). The Fetch API's default behavior is `redirect: "follow"`, meaning it silently follows the chain until it reaches a non-redirect response, and returns that.

So the two layers are actually operating on different things:

| Layer | What it sees |
|---|---|
| Validation Layer | The hostname in the **original URL** (`cdn.example.com`) |
| Processing Layer | The hostname in the **final URL after redirects** (could be anything) |

This is a **TOCTOU (Time-of-Check to Time-of-Use)** gap. The security check validates one value, but the system acts on a potentially different value.

---

## The Attack: Exploiting the Gap

An attacker who holds a valid API key with `cdn.example.com` in their allowlist discovers an open redirect on that domain — say, `https://cdn.example.com/go?url=<target>`. They construct a signed request:

```text
GET /api/v1/my-project/w_800/cdn.example.com/go?url=http://169.254.169.254/latest/meta-data/
```

Here is what happens at each layer:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ API Gateway Layer                                                    │
│  Signature valid ✅ · API key active ✅ · Rate limit OK ✅            │
├──────────────────────────────────────────────────────────────────────┤
│ Validation Layer                                                     │
│  Source domain: "cdn.example.com" ∈ allowlist ✅                      │
├──────────────────────────────────────────────────────────────────────┤
│ Processing Layer (IPX)                                               │
│  fetch("https://cdn.example.com/go?url=http://169.254.169.254/...") │
│    → 302 Found → Location: http://169.254.169.254/latest/meta-data/ │
│    → fetch("http://169.254.169.254/latest/meta-data/")   ← NO CHECK │
│    → Response: IAM credentials                                       │
└──────────────────────────────────────────────────────────────────────┘
```

The server has just made an HTTP request to the cloud provider's instance metadata endpoint — an address that should never be reachable from user-controlled input. The attacker can use the same technique to reach any host visible from the server's network: internal microservices, databases with HTTP APIs, Kubernetes endpoints, or admin panels.

This class of vulnerability is called **SSRF (Server-Side Request Forgery)**. What makes this variant particularly subtle is that the initial URL *does* pass domain validation. The attacker doesn't need to sneak a malicious hostname past the check — they just need any redirect on an already-trusted domain.

---

## The Design Principle: Enforce Policy at the Point of Execution

The root cause is an architectural pattern that appears safe but isn't:

> **Anti-pattern:** Validate the input, then pass it to a component that transforms the input before acting on it.

The Validation Layer checked the URL. The Processing Layer then gave that URL to `fetch()`, which transparently transformed it (by following redirects) before making the actual network request. The validation was correct for the original input but meaningless for the transformed input.

The general principle:

> **Security invariants must be enforced at the point where the action is taken — not at an earlier stage whose output can be modified before execution.**

In a layered architecture, this means the component that makes the network call must either:

1. **Refuse to let the input change** — block redirects so the URL that was validated is the URL that is fetched, or
2. **Re-validate after the input changes** — follow redirects manually and re-run domain validation on each hop.

If you delegate the network call to a third-party library (as we do with IPX), you often can't inject custom validation into the library's internal fetch logic. That makes option 1 the only practical choice in most cases.

---

## The Fix: Constraining the Processing Layer

The Fetch API provides a `redirect` option with three modes:

| Mode | Behavior | Use case |
|---|---|---|
| `"follow"` | Silently follow all redirects (default) | General-purpose browsing |
| `"error"` | Throw `TypeError` on any redirect | Strict proxies where the validated URL must be the fetched URL |
| `"manual"` | Return the `3xx` response without following | When you need to inspect and re-validate before following |

We configured IPX's HTTP storage layer to reject redirects:

```typescript
export function getProjectIPX() {
  return createIPX({
    storage: ipxFSStorage({ dir: path.join(process.cwd(), "public") }),
    httpStorage: ipxHttpStorage({
      // Safe only because (1) domain validation happens upstream in the route
      // handler, and (2) redirect: "error" below prevents redirect-based
      // bypasses. Removing redirect: "error" turns this into an open proxy.
      // Prefer allowAllDomains: false with an explicit domain allowlist unless
      // you have equivalent upstream controls.
      allowAllDomains: true,
      fetchOptions: { redirect: "error" },
    }),
  });
}
```

Note that `allowAllDomains: true` is intentionally set here because IPX's built-in domain check only performs exact hostname matching, while our upstream validation supports subdomain matching (e.g., allowing `images.unsplash.com` when `unsplash.com` is on the allowlist). This is safe **only** because `redirect: "error"` ensures the URL that passed upstream validation is precisely the URL that gets fetched — no redirect can reroute the request to an unvalidated host. If you remove or change the `redirect` option, `allowAllDomains: true` creates an open-proxy vulnerability. If your system does not have equivalent upstream domain validation, keep `allowAllDomains: false` and pass an explicit domain allowlist to IPX instead.

`ipxHttpStorage` accepts a `fetchOptions` field (typed as `RequestInit`) that is forwarded to every internal `fetch` call. Setting `redirect: "error"` means any `3xx` response immediately throws an error, which propagates up through IPX and is caught by the route handler's `catch` block, returning a `500` to the client.

After the fix, the system enforces a strict invariant: **the URL that passes domain validation is precisely the URL that the server contacts**. No transformation happens between validation and execution.

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Validation Layer                                                     │
│  Source domain: "cdn.example.com" ∈ allowlist ✅                      │
├──────────────────────────────────────────────────────────────────────┤
│ Processing Layer (IPX)                                               │
│  fetch("https://cdn.example.com/go?url=...")                         │
│    → 302 Found                                                       │
│    → redirect: "error" → TypeError thrown 🛑                         │
│    → Request aborted, 500 returned to client                         │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Alternative Design: Re-Validate on Redirect

If the system needed to support legitimate redirects (e.g., CDNs that use `302` for geographic load balancing), the alternative is `redirect: "manual"` with a validation loop:

```text
fetch(url, { redirect: "manual" })
  → if 3xx:
      extract Location header
      validate new hostname against allowlist
      if allowed: fetch(new_url, { redirect: "manual" })  ← repeat (up to N hops)
      if not allowed: reject
  → if 200: return response
```

This is more complex and introduces additional concerns:

- **Max hop limit** — without one, a redirect loop becomes a denial-of-service vector.
- **Relative URLs** — `Location` headers can be relative, requiring URL resolution.
- **Protocol downgrade** — a redirect from `https://` to `http://` could leak data in transit.
- **Larger attack surface** — more code paths to test and audit.

We chose `redirect: "error"` because image CDNs serve assets directly, and the added complexity of manual redirect handling isn't justified by the use case. The simpler design is also the more secure one.

---

## Broader Lessons for System Design

### 1. Treat Every Server-Side Fetch as a Proxy

Any time your server makes an HTTP request to a URL derived from user input, you are building a proxy. Apply proxy-level security: validate the *final* destination, not just the input.

### 2. Third-Party Libraries Are Part of Your Trust Boundary

When you delegate a network call to a library, its default configuration becomes your security posture. IPX's default `redirect: "follow"` is perfectly reasonable for a general-purpose image optimizer — but inside our security model, it violated our invariant. Always audit the defaults of libraries that make outbound network requests on your behalf.

### 3. Defense in Depth Still Requires Correct Layering

Our system had multiple security layers (signatures, rate limits, domain allowlists), but they were all positioned *before* the processing step. None of them constrained *how* the processing step behaved. A layered defense is only effective if at least one layer is positioned at or after the point of execution.

### 4. Prefer Eliminating Behavior Over Detecting Abuse

We could have tried to detect SSRF attempts by inspecting redirect targets, blocking private IP ranges, or analyzing response content. Each of those approaches is a cat-and-mouse game with known bypasses (DNS rebinding, IPv6 mapped addresses, cloud metadata via custom domains). Instead, we eliminated the behavior entirely: no redirects are followed, period. **Reducing capability is more reliable than detecting misuse.**
