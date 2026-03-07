<p align="center">
  <picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/EricTsai83/optstuff/main/assets/og-readme.png">
  <img src="https://raw.githubusercontent.com/EricTsai83/optstuff/main/assets/og-readme.png" width="600" height="219" alt="Logo for OptStuff">
</picture>
</p>

<p align="center">
  A thing for optimizing images.
</p>

<div align="center">
  <a href="https://optstuff.vercel.app">Home</a> | <a href="https://docs-optstuff.vercel.app">Docs</a> | <a href="https://optstuff-nextjs.vercel.app">Demo</a>
</div>


## What is OptStuff?

OptStuff is an open-source image optimization service that transforms images on-the-fly via URL parameters. Point your image URLs through the OptStuff API, and it delivers optimized images with the right format, size, and quality — all secured by HMAC-SHA256 signed URLs.

```http
GET /api/v1/my-blog/w_800,q_80,f_webp/cdn.example.com/photo.jpg?key=pk_...&sig=...
```

## Key Features

- **On-the-fly Optimization** — Resize, format conversion (WebP, AVIF), and quality adjustment via URL parameters
- **Signed URL Security** — HMAC-SHA256 signatures prevent unauthorized access
- **Multi-tenant Architecture** — Teams → Projects → API Keys hierarchy
- **Domain Whitelisting** — Two-layer control for image sources and authorized websites
- **Encrypted Key Storage** — AES-256-GCM encryption for API keys at rest
- **Rate Limiting** — Configurable per-minute and per-day limits per API key
- **Usage Analytics** — Request logs, bandwidth tracking, and top images statistics

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Database | PostgreSQL (Drizzle ORM) |
| Auth | Clerk |
| API Layer | tRPC |
| Image Engine | IPX (Sharp) |
| UI | shadcn/ui, Tailwind CSS |
| Monorepo | Turborepo, pnpm |

## Project Structure

```text
apps/
  optstuff-dashboard/   # Main application (dashboard + image API)
  docs/                 # Documentation site (Fumadocs)
  optstuff-marketing/   # Marketing / landing page
examples/
  nextjs/               # Next.js integration example
packages/
  ui/                   # Shared UI components (shadcn/ui)
  auth/                 # Shared auth utilities
  hooks/                # Shared React hooks
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9+
- PostgreSQL database
- Clerk account

### Setup

```bash
# Clone the repository
git clone https://github.com/EricTsai83/optstuff.git
cd optstuff

# Install dependencies
pnpm install

# Copy environment variables
cp apps/optstuff-dashboard/.env.example apps/optstuff-dashboard/.env

# Edit .env with your database, Clerk, and encryption credentials

# Push database schema
pnpm db:push

# Start development server
pnpm dev
```

### Environment Variables

See the [Environment Variables documentation](./apps/docs/content/docs/self-hosting/environment-variables.mdx) for a complete reference.

## Documentation

Full documentation is available in the docs site:

- [Quick Start](./apps/docs/content/docs/getting-started/quickstart.mdx) — Get your first optimized image in 5 minutes
- [Integration Guide](./apps/docs/content/docs/getting-started/integration-guide.mdx) — Add OptStuff to your application
- [API Reference](./apps/docs/content/docs/api-reference/endpoint.mdx) — Full endpoint documentation
- [Self-Hosting](./apps/docs/content/docs/self-hosting/deployment.mdx) — Deploy your own instance

## License

MIT
