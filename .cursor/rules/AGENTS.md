# Project Instructions

OptStuff is a secure image optimization API service providing on-the-fly image optimization, signed URL security, and multi-tenant management.

## Code Style
- Use TypeScript for all new files
- Prefer functional components in React
- Use snake_case for database columns and table names


## Build/Test Commands

Always us `pnpm` to run scripts.

- `pnpm dev` - Start development server (Vite + Convex via turbo) [Note: Don't use this unless otherwise told to]
- `pnpm lint` - Type-aware Oxlint linting (also reports Typescript errors)
- `pnpm lint --fix` - Apply fixes for autofixable lint issues
- `pnpm format` - Format all files with Prettier
- `pnpm format:check` - Check formatting without writing

### Dashboard-specific (`apps/optstuff-dashboard`):
- `pnpm db:push` - Push schema changes directly (dev only)

**Important:** After modifying `schema.ts`, run `pnpm db:push` in `apps/optstuff-dashboard` to sync changes to the database.

**Do not run:** `pnpm dev` (assume already running), `pnpm build` (CI only)


## Architecture

## Architecture
- Follow the repository pattern
- Keep business logic in service layers

#### stack Overview

- **Monorepo**: pnpm workspaces + Turborepo
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5.9, React 19
- **API Layer**: tRPC 11 with SuperJSON transformer
- **Database**: PostgreSQL via Drizzle ORM
- **Auth**: Clerk (via `@workspace/auth`)
- **Caching / Rate Limiting**: Upstash Redis
- **UI**: Tailwind CSS 4, Radix UI, Lucide icons, Recharts
- **Validation**: Zod 4
- **Image Processing**: IPX (Sharp)
  
### Workspace Structure

```
apps/
  optstuff-dashboard/  — Main dashboard app (tRPC, Drizzle, Clerk)
  optstuff-marketing/  — Marketing website
  docs/                — Documentation site (Fumadocs)
packages/
  ui/                  — Shared UI components (@workspace/ui)
  auth/                — Auth utilities (@workspace/auth)
  hooks/               — Shared React hooks (@workspace/hooks)
  eslint-config/       — Shared ESLint config
  typescript-config/   — Shared TypeScript config
examples/
  nextjs/              — Next.js integration example
```
