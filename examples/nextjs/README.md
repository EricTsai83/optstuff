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

- `src/lib/optstuff.ts`
  - URL signing utilities (`generateOptStuffUrl`, `getBlurDataUrl`)
- `src/lib/next-image-optstuff-loader.ts`
  - global custom loader + shared URL builder
- `src/app/api/optstuff/route.ts`
  - GET: redirect signing endpoint for `next/image`
  - POST: JSON endpoint for playground / custom clients
- `src/components/optstuff-image.tsx`
  - simplified blur-to-clear wrapper around `next/image`

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

Supported OptStuff-specific props:

- `format?: "webp" | "avif" | "png" | "jpg"`
- `fit?: "cover" | "contain" | "fill"`
- `blurPlaceholder?: boolean`
- `transitionPreset?: "instant" | "smooth" | "cinematic"`
- `transitionConfig?: { blurFadeDurationMs?, sharpFadeDurationMs?, sharpStartOpacity?, easing? }`
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
