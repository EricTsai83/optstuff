# OptStuff + Next.js Demo

This demo shows a **teaching-first integration** of OptStuff with Next.js:

1. optimize images through `next/image`
2. keep signing secrets on the server
3. deliver responsive/image-format variants from one source URL

It is intentionally simplified so users can understand the core pattern quickly.

## What this demo teaches

- How to wire a custom `next/image` loader to `/api/optstuff`
- How to sign OptStuff URLs server-side with HMAC-SHA256
- How to add optional blur-to-clear loading with the `OptStuffImage` wrapper
- How to protect your signing endpoint with source-host allowlisting
- How cache headers affect redirect and signed URL responses

## Quick start

### 1) Install

```bash
cd examples/nextjs
pnpm install
```

### 2) Configure environment variables

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

```bash
OPTSTUFF_BASE_URL=https://your-optstuff-instance.com
OPTSTUFF_PROJECT_SLUG=my-project
OPTSTUFF_PUBLIC_KEY=pk_xxx
OPTSTUFF_SECRET_KEY=sk_xxx

# Optional: comma-separated host allowlist for /api/optstuff
# Defaults: images.unsplash.com
OPTSTUFF_ALLOWED_IMAGE_HOSTS=images.unsplash.com
```

Hero blur mode and timeout/cache tuning are configured in code:

- `src/lib/hero-blur-config.ts`

### 3) Run

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Demo architecture

```text
Client UI
  └─ next/image / OptStuffImage
      └─ custom loader -> /api/optstuff?url=...&w=...&q=...&f=...&fit=...
          └─ server-side signing (HMAC)
              └─ 302 redirect to signed OptStuff URL
```

## Core files

- `src/lib/optstuff-core.ts`
  - URL signing utility (`generateOptStuffUrl`)
- `src/lib/optstuff-blur.ts`
  - optional hero blur utility (`getBlurDataResult`, `getBlurDataUrl`)
- `src/lib/next-image-optstuff-loader.ts`
  - global custom loader + shared URL builder
- `src/app/api/optstuff/route.ts`
  - GET: redirect signing endpoint for `next/image`
  - POST: JSON endpoint for playground / custom clients
- `src/components/optstuff-image.tsx`
  - simplified blur-to-clear wrapper around `next/image`

## Copy only the core integration

If you only want the production integration pattern, copy these files first:

1. `src/lib/optstuff-core.ts`
2. `src/lib/next-image-optstuff-loader.ts`
3. `src/app/api/optstuff/route.ts`
4. `src/components/optstuff-image.tsx` (or your own thin wrapper)

These four files are enough to get:

- server-side URL signing
- custom `next/image` loader routing through `/api/optstuff`
- source-host validation on the signing endpoint
- responsive `srcSet` support without exposing `OPTSTUFF_SECRET_KEY`

If you also want server-generated blur placeholders, additionally copy:

- `src/lib/optstuff-blur.ts`
- `src/lib/hero-blur-config.ts`

## Demo-only files (optional)

You do **not** need to copy the showcase UI to integrate OptStuff:

- `src/components/home-page-content.tsx`
- `src/components/format-comparison.tsx`
- `src/components/responsive-demo.tsx`
- `src/components/optimizer-playground.tsx`
- `src/components/hero-refresh-toggle.tsx`
- `src/components/scroll-header.tsx`
- `src/components/deferred-mount.tsx`

They are teaching/demo UI only and can be omitted in real projects.

## API endpoints

### `GET /api/optstuff`

Used by the custom image loader.

Query params:

- `url` (required): source image URL
- `w` / `h` (optional): width/height
- `q` (optional): quality (`1-100`)
- `f` (optional): `webp | avif | png | jpg`
- `fit` (optional): `cover | contain | fill`

Response:

- `302` redirect to a signed OptStuff URL
- cache headers are applied (`s-maxage`, `max-age`, `stale-while-revalidate`)

### `POST /api/optstuff`

Used by the playground or client-side custom flows.

Request body:

```json
{
  "imageUrl": "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
  "width": 800,
  "quality": 80,
  "format": "webp",
  "fit": "cover"
}
```

Response body:

```json
{ "url": "https://<optstuff>/api/v1/..." }
```

## URL signing strategies

OptStuff requires every image request to carry an HMAC-SHA256 signature. The secret key must never be exposed to the browser. This demo ships two strategies for generating that signature — **client-side proxy signing** and **server-side pre-signing** — each suited to different use cases.

### Strategy 1: Client-side proxy signing (default)

The browser never touches the secret key. Instead, `next/image` routes every request through a local API endpoint that signs URLs on the server and returns a redirect.

```text
Browser (next/image srcset)
  → loader builds /api/optstuff?url=...&w=800&q=80&f=webp
  → API route signs the URL with HMAC-SHA256
  → 302 redirect to signed OptStuff URL
  → Browser follows redirect, gets optimized image
```

**How to use:**

```tsx
<OptStuffImage
  src="https://images.unsplash.com/photo-xxx"
  width={800}
  height={500}
  alt="A photo"
  format="webp"
/>
```

No special props needed — this is the default behavior.

**Pros:**

- Responsive `srcSet` — `next/image` generates multiple widths, each independently signed
- Simple DX — just pass the original image URL
- Secret key stays on the server
- Redirect responses can be cached by CDN/edge (`Cache-Control: s-maxage`)

**Cons:**

- Extra network hop — each width in the `srcSet` hits `/api/optstuff` first (mitigated by CDN cache)
- Signing happens per-request (though cached redirects avoid repeated signing)
- Cannot leverage `"use cache"` / `cacheLife` for the signed URL itself

**Best for:** general images, product catalogs, user-uploaded content — any case where you want responsive `srcSet` across multiple widths.

### Strategy 2: Server-side pre-signing (`preSigned`)

The Server Component generates the signed URL at render time using `generateOptStuffUrl()`, then passes the complete URL as a prop. The client uses it as-is, no loader, no proxy.

```text
Server Component (page.tsx / RSC)
  → calls generateOptStuffUrl(src, { width: 1600, ... })
  → returns fully signed URL with ?key=...&exp=...&sig=...
  → passes URL as prop to <OptStuffImage preSigned />
  → Browser requests the signed URL directly
```

**How to use:**

```tsx
// Server Component
const heroUrl = generateOptStuffUrl(imageUrl, { width: 1600, quality: 85 }, ttl);

// Client Component
<OptStuffImage
  src={heroUrl}
  fill
  alt="Hero"
  preSigned            // ← tells the component: URL is already signed
  blurPlaceholder
  blurDataUrl={blurData}
/>
```

**Pros:**

- Zero extra hops — browser requests the signed URL directly
- Works with `"use cache"` + `cacheLife()` — signed URL can be cached across requests
- Full control over expiration (`exp` parameter baked into the signature)
- Great for critical images (hero, OG image) where latency matters

**Cons:**

- Single width — the URL is signed for one specific set of parameters (width, quality, format)
- No responsive `srcSet` — cannot generate multiple widths without multiple signed URLs
- Rendered with `unoptimized` — Next.js skips its image optimization pipeline entirely
- Must manage TTL carefully — expired signatures return 403

**Best for:** hero images, above-the-fold critical images, OG/social images — cases where you want maximum cache control and minimal latency for a single known variant.

### Quick comparison

| | Proxy signing (default) | Pre-signing (`preSigned`) |
|---|---|---|
| Signing location | `/api/optstuff` route handler | Server Component / RSC |
| Secret key exposure | Never (server-only) | Never (server-only) |
| Responsive `srcSet` | Yes (multiple widths) | No (single width) |
| Network hops | 2 (redirect + image) | 1 (image only) |
| Cache strategy | CDN caches redirect | `"use cache"` / `cacheLife` |
| Next.js optimization | Custom loader | `unoptimized` |
| Best for | General images | Critical / hero images |

### Choosing a strategy

Use the **default proxy signing** unless you have a specific reason not to. Switch to **pre-signing** when:

1. The image is above-the-fold and latency is critical
2. You want to leverage React Server Component caching (`"use cache"`)
3. You only need one specific width/quality variant
4. You want explicit control over URL expiration

Both strategies can coexist in the same page — this demo uses proxy signing for showcase cards and pre-signing for the hero image.

## `OptStuffImage` usage

Basic:

```tsx
import { OptStuffImage } from "@/components/optstuff-image";

<OptStuffImage
  src="https://images.unsplash.com/photo-1506744038136-46273834b3fb"
  width={800}
  height={500}
  alt="Demo image"
/>;
```

With explicit format/fit/quality:

```tsx
<OptStuffImage
  src="https://images.unsplash.com/photo-1506744038136-46273834b3fb"
  width={1200}
  height={750}
  alt="Hero"
  format="avif"
  fit="cover"
  quality={85}
  transitionPreset="smooth"
/>;
```

Optional blur-to-clear (used in the Hero demo):

```tsx
<OptStuffImage
  src="https://images.unsplash.com/photo-1506744038136-46273834b3fb"
  width={1200}
  height={675}
  alt="Hero blur demo"
  blurPlaceholder
  blurDataUrl={heroBlurDataUrl}
/>;
```

Hero blur supports two modes:

- `build-cache`: server-side cache mode with split TTL strategy (success cache is long, miss cache is short)
- `realtime`: request blur on every page request (`no-store`)

Switch mode (and cache/timeout settings) in:

- `src/lib/hero-blur-config.ts`

When blur generation fails, the demo now skips blur placeholder instead of injecting a fallback image.

Dev mode also includes a blur debug panel showing `mode`, `source`, whether a network request happened, and miss diagnostics (reason/status/content-type/duration).

In development, you can use the **Dev Tool: Force Hero Image Refresh** card above the Hero image.

How to test the button:

1. Set `mode: HERO_BLUR_MODE.BUILD_CACHE` in `src/lib/hero-blur-config.ts`.
2. Open the home page in dev mode, then click the button to `force refresh: on`.
3. Confirm URL contains `?hero-refresh=1`.
4. In the blur debug panel, verify:
   - `Force Refresh: on`
   - `Network Request: yes`
   - `source` is typically `network` for that request
5. Click again to disable (or remove `?hero-refresh=1`) and return to normal cache behavior.

In `realtime` mode, blur already requests from network on every load. The button is still useful for forcing a fresh sharp hero image URL.

If needed, you can still force it manually with:

```text
/?hero-refresh=1
```

This forces Hero refresh behavior manually. For backward compatibility, `?blur-bust=1` is also supported.

Supported OptStuff-specific props:

- `format?: "webp" | "avif" | "png" | "jpg"`
- `fit?: "cover" | "contain" | "fill"`
- `preSigned?: boolean` — treat `src` as an already-signed URL (see [URL signing strategies](#url-signing-strategies))
- `blurPlaceholder?: boolean`
- `transitionPreset?: "instant" | "smooth" | "cinematic"`
- `transitionConfig?: { sharpFadeInMs?, blurFadeOutMs?, blurFadeOutDelayMs?, blurShowDelayMs?, easing? }`
- `blurWidth?: number` (default `32`)
- `blurQuality?: number` (default `20`)
- `blurDataUrl?: string`

## Next.js configuration notes

In `next.config.ts` this demo enables:

- `reactCompiler: true`
- `cacheComponents: true`
- `images.loader = "custom"`
- `images.loaderFile = "./src/lib/next-image-optstuff-loader.ts"`
- `images.remotePatterns` for Unsplash hosts used in the demo

## Security notes

`/api/optstuff` is a signing endpoint. Treat it like a sensitive API.

- Keep `OPTSTUFF_SECRET_KEY` server-only
- Validate source hostnames (this demo enforces allowlisting)
- Add authentication in production
- Add rate limiting in production

## Troubleshooting

- **Error: missing env variable**  
  Check `.env.local` values. Placeholder values (`xxx`, `your-*`) are rejected.

- **`imageUrl/url hostname is not allowed`**  
  Add hostnames to `OPTSTUFF_ALLOWED_IMAGE_HOSTS`.

- **Images not loading through `next/image`**  
  Confirm host is included in `images.remotePatterns` and the API allowlist.

## License

MIT (same as the root repository).
