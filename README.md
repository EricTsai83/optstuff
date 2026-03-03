# OptStuff

Secure, high-performance image optimization API with signed URLs, domain whitelisting, and multi-tenant support.

## What is OptStuff?

OptStuff is an open-source image optimization service that transforms images on-the-fly via URL parameters. Point your image URLs through the OptStuff API, and it delivers optimized images with the right format, size, and quality — all secured by HMAC-SHA256 signed URLs.

```
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

```
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

See the [Environment Variables documentation](https://docs-optstuff.vercel.app/self-hosting/environment-variables) for a complete reference.

## Documentation

Full documentation is available at [docs-optstuff.vercel.app](https://docs-optstuff.vercel.app):

- [Quick Start](https://docs-optstuff.vercel.app/getting-started/quickstart) — Get your first optimized image in 5 minutes
- [Integration Guide](https://docs-optstuff.vercel.app/getting-started/integration-guide) — Add OptStuff to your application
- [API Reference](https://docs-optstuff.vercel.app/api-reference/endpoint) — Full endpoint documentation
- [Self-Hosting](https://docs-optstuff.vercel.app/self-hosting/deployment) — Deploy your own instance

## License

MIT
