# OptStuff + Next.js Integration Example

A standalone Next.js application demonstrating how to integrate the [OptStuff](https://optstuff.vercel.app) image optimization service into your Next.js project. With OptStuff, you can dynamically resize images, convert formats, adjust quality on request, and secure URLs with HMAC-SHA256 signatures.

## Features

- **Server-side URL signing** — Generate signed URLs with HMAC-SHA256; secret keys are never exposed to the client
- **Dynamic image operations** — Resize, format conversion (WebP / AVIF / PNG / JPG), quality control, and crop modes
- **API Route integration** — Provides an `/api/optstuff` endpoint for the frontend to obtain signed URLs
- **Bucketed URL expiration** — Stable signatures inside each time bucket for better CDN/browser cache hit rate
- **Cacheable signing redirects** — `/api/optstuff` can be cached at the CDN edge (`s-maxage`) to reduce repeated signing work
- **next/image custom loader** — Example code showing how to use OptStuff with `next/image`

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- An OptStuff account (sign up at the [OptStuff Dashboard](https://optstuff.vercel.app))

## Quick Start

### 1. Clone the project

```bash
git clone https://github.com/EricTsai83/optstuff.git
cd optstuff/examples/nextjs
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your OptStuff credentials (available from the [Dashboard](https://optstuff.vercel.app)):

```bash
# Base URL for the OptStuff service
OPTSTUFF_BASE_URL=https://your-optstuff-instance.com

# Your project slug (obtained after creating a project in the Dashboard)
OPTSTUFF_PROJECT_SLUG=my-project

# Public key (used to identify the request source)
OPTSTUFF_PUBLIC_KEY=pk_xxx

# Secret key (used to sign URLs — keep this confidential)
OPTSTUFF_SECRET_KEY=sk_xxx

# Public env vars (used by the optional next/image custom loader — see Option 4)
NEXT_PUBLIC_OPTSTUFF_URL=https://your-optstuff-instance.com
NEXT_PUBLIC_OPTSTUFF_SLUG=my-project
```

> **Important:** `OPTSTUFF_SECRET_KEY` must only be used on the server side. Never expose it to the client.

### 4. Start the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the interactive demo page.

## Project Structure

```text
src/
├── app/
│   ├── api/
│   │   └── optimize/
│   │       └── route.ts        # API Route — accepts params, generates signed URL
│   ├── layout.tsx              # Root layout component
│   ├── page.tsx                # Interactive demo page
│   └── globals.css             # Global styles (Tailwind CSS)
├── components/
│   └── optstuff-image.tsx      # Drop-in <OptStuffImage> component (Server Component)
└── lib/
    └── optstuff.ts             # OptStuff URL signing utilities
```

## Core Concepts

### URL Structure

OptStuff image optimization URLs follow this format:

```text
{OPTSTUFF_BASE_URL}/api/v1/{project_slug}/{operations}/{image_host/path}?key={public_key}&sig={signature}&exp={expiry}
```

Breakdown:

| Part | Description | Example |
|------|-------------|---------|
| `OPTSTUFF_BASE_URL` | Your OptStuff service URL | `https://your-optstuff-instance.com` |
| `project_slug` | Project identifier | `my-project` |
| `operations` | Comma-separated image operations | `w_800,q_80,f_webp,fit_cover` |
| `image_host/path` | Original image host and path (without protocol) | `images.unsplash.com/photo-xxx` |
| `key` | Public key | `pk_xxx` |
| `sig` | HMAC-SHA256 signature | `a1b2c3...` |
| `exp` | HMAC expiry timestamp (optional) | `1700000000` |

### Supported Image Operations

| Operation | Format | Description | Example |
|-----------|--------|-------------|---------|
| Width | `w_{pixels}` | Resize image width (pixels) | `w_800` |
| Height | `h_{pixels}` | Resize image height (pixels) | `h_600` |
| Quality | `q_{1-100}` | Compression quality (1 = lowest, 100 = highest) | `q_80` |
| Format | `f_{format}` | Output format: `webp`, `avif`, `png`, `jpg` | `f_webp` |
| Fit | `fit_{mode}` | Crop mode: `cover`, `contain`, `fill` | `fit_cover` |

Multiple operations are joined with commas, e.g.: `w_800,q_80,f_webp,fit_cover`

### Signing Process

To prevent unauthorized image operations, OptStuff uses HMAC-SHA256 signatures. The signing process works as follows:

```text
sign_content = "{ops}/{image}"                        # e.g. "w_800,q_80,f_webp/images.unsplash.com/photo-xxx"
sign_content = sign_content + "?exp={exp}"            # append only when the URL has an expiration timestamp
signature    = HMAC-SHA256(secret_key, sign_content)  # raw digest → base64url → take first 32 characters
```

> **Note:** `sign_content` does **not** include the `/api/v1/{project_slug}/` prefix or the `key` query parameter — only the operations + image path (and, if present, the `exp` value). The signature is the raw HMAC-SHA256 digest encoded as **base64url** and **truncated to 32 characters**.
>
> For better cache reuse in production (including Vercel), this example uses **bucketed expiration** (hourly by default). URLs generated within the same bucket share the same `exp`, so CDN keys are more stable.

## Integration Guide

### Option 1: Using the `<OptStuffImage>` component (recommended)

The `src/components/optstuff-image.tsx` file provides a drop-in `next/image` wrapper. It is a **Server Component** — the signed URL is generated on the server so the secret key is never exposed to the client.

```tsx
import { OptStuffImage } from "@/components/optstuff-image";

// Basic — same API as next/image, just swap the import
<OptStuffImage
  src="https://images.unsplash.com/photo-1506744038136-46273834b3fb"
  width={800}
  height={600}
  alt="Landscape"
/>

// With OptStuff-specific options
<OptStuffImage
  src="https://images.unsplash.com/photo-1506744038136-46273834b3fb"
  width={400}
  height={300}
  alt="Retina landscape"
  optimizeWidth={800}   // fetch 800px wide for 2x retina
  format="avif"
  quality={90}
  fit="contain"
  expiresIn={7200}      // URL valid for 2 hours
/>

// Fill mode (responsive container)
<div style={{ position: "relative", width: "100%", height: 400 }}>
  <OptStuffImage
    src="https://images.unsplash.com/photo-1506744038136-46273834b3fb"
    fill
    alt="Full-width hero"
    optimizeWidth={1920}
    style={{ objectFit: "cover" }}
  />
</div>
```

**Props** (in addition to all standard `next/image` props):

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | — | Full URL of the original image |
| `optimizeWidth` | `number` | `width` prop | Override the optimization width (e.g. 2x for retina) |
| `optimizeHeight` | `number` | `height` prop | Override the optimization height |
| `format` | `"webp" \| "avif" \| "png" \| "jpg"` | `"webp"` | Output format |
| `fit` | `"cover" \| "contain" \| "fill"` | `"cover"` | Crop / fit mode |
| `quality` | `number` | `80` | Compression quality (1–100) |
| `expiresIn` | `number` | `3600` | Signed URL time-to-live in seconds |

### Option 2: Using the utility function

The `src/lib/optstuff.ts` file provides a `generateOptStuffUrl()` function that encapsulates the full signing logic:

```typescript
import { generateOptStuffUrl } from "@/lib/optstuff";

const optimizedUrl = generateOptStuffUrl(
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
  {
    width: 800,
    quality: 80,
    format: "webp",
    fit: "cover",
  },
  3600, // URL time-to-live in seconds (optional)
);
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `imageUrl` | `string` | Yes | Full URL of the original image |
| `operations` | `ImageOperation` | Yes | Image operation parameters object |
| `expiresInSeconds` | `number` | No | URL time-to-live in seconds; omit for no expiration |

> **Note:** This function uses the Node.js `crypto` module and can only run on the server side (Server Components, API Routes, `getServerSideProps`, etc.).

### Option 3: Via API Route

If you need to obtain a signed URL from a Client Component, call the `/api/optstuff` endpoint:

```typescript
const response = await fetch("/api/optstuff", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
    width: 800,
    quality: 80,
    format: "webp",
    fit: "cover",
  }),
});

const { url } = await response.json();
// url is the signed OptStuff image URL
```

> **Security warning:** The `/api/optstuff` endpoint acts as a **signing oracle** — it signs whatever `imageUrl` the caller provides. Without server-side validation, an attacker can submit arbitrary URLs (including internal network addresses) and receive a valid signed URL, which the OptStuff proxy will then fetch on the server side (**SSRF risk**). To mitigate this:
>
> - **Validate / whitelist `imageUrl` origins** — Only sign URLs whose hostname belongs to an approved set of image sources (e.g., `images.unsplash.com`).
> - **Require authentication** — Protect `/api/optstuff` behind session-based auth or an API token so only your own frontend can call it.
> - **Rate-limit the endpoint** — Prevent abuse by limiting how many signed URLs a single client can request.

**Request parameters (JSON body):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `imageUrl` | `string` | Yes | Original image URL — **validate the origin server-side** (see warning above) |
| `width` | `number` | No | Target width |
| `height` | `number` | No | Target height |
| `quality` | `number` | No | Compression quality (1–100) |
| `format` | `string` | No | Output format: `webp` / `avif` / `png` / `jpg` |
| `fit` | `string` | No | Crop mode: `cover` / `contain` / `fill` |

**Response format:**

```json
{ "url": "https://your-optstuff-instance.com/api/v1/my-project/w_800,q_80,f_webp,fit_cover/images.unsplash.com/photo-xxx?key=pk_xxx&exp=1700000000&sig=abc123" }
```

### Option 4: With a next/image custom loader

You can create a custom loader so that the `next/image` component automatically optimizes images through OptStuff:

**1. Create the loader file `src/lib/optstuff-loader.ts`:**

```typescript
export default function optStuffLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  const ops = `w_${width},q_${quality ?? 80},f_webp`;
  return `${process.env.NEXT_PUBLIC_OPTSTUFF_URL}/api/v1/${process.env.NEXT_PUBLIC_OPTSTUFF_SLUG}/${ops}/${src}`;
}
```

> **Note:** The custom loader runs on the client side, so it uses `NEXT_PUBLIC_` prefixed environment variables. Since the URL is not signed in this approach, you should use OptStuff's Domain Allowlist feature to restrict access.
>
> **Important:** `optStuffLoader` concatenates `src` directly into the URL path (`.../${ops}/${src}`), so `src` must **not** include a protocol or leading slashes. Passing a full URL like `https://cdn.example.com/photo.jpg` will produce a malformed OptStuff URL. Use the bare host + path form instead (e.g., `cdn.example.com/photo.jpg`). If your image URLs include a protocol, strip it before passing to the loader:
>
> ```typescript
> const bare = url.replace(/^https?:\/\//, "");
> ```

**2. Configure `next.config.ts`:**

```typescript
const nextConfig = {
  images: {
    loader: "custom",
    loaderFile: "./src/lib/optstuff-loader.ts",
  },
};

export default nextConfig;
```

**3. Use in a component:**

```tsx
import Image from "next/image";

<Image
  src="cdn.example.com/photo.jpg"
  width={800}
  height={600}
  alt="Optimized image"
/>
```

`next/image` will automatically call the loader and generate optimized image URLs based on device size.

## Security Considerations

- **Keep the secret key confidential** — `OPTSTUFF_SECRET_KEY` should only exist in server-side environment variables; do not use the `NEXT_PUBLIC_` prefix
- **Set URL expiration** — Use the `expiresInSeconds` parameter to limit URL validity; this example defaults to 3600 seconds (1 hour)
- **Configure domain security** — In the OptStuff Dashboard, go to project Settings → Domain Security to configure Image Sources (which domains can be fetched) and Authorized Websites (which sites can embed optimized images)
- **Add authentication to the API Route** — In production, add authentication or rate limiting to `/api/optstuff`

## Further Reading

- [OptStuff Documentation](https://docs-optstuff.vercel.app)
- [Next.js Documentation](https://nextjs.org/docs)
- [next/image Custom Loader](https://nextjs.org/docs/app/api-reference/components/image#loader)
