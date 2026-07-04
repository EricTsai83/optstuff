# OptStuff Dashboard

Dashboard and image API application for OptStuff.

## Responsibilities

- Authenticated dashboard for teams, projects, API keys, domain security, and usage analytics
- Signed image optimization API at `/api/v1/{projectSlug}/{operations}/{imageUrl}`
- Request validation, rate limiting, source-domain enforcement, usage metering, and request logging

## Image API

```http
GET /api/v1/{projectSlug}/{operations}/{imageUrl}?key={publicKey}&sig={signature}&exp={expiresAt}
HEAD /api/v1/{projectSlug}/{operations}/{imageUrl}?key={publicKey}&sig={signature}&exp={expiresAt}
```

Example:

```http
GET /api/v1/my-blog/w_800,f_webp,q_80/cdn.example.com/photo.jpg?key=pk_...&sig=...
```

Supported operation keys are `w`, `h`, `q`, `f`, `fit`, `s`, and `embed`; use `_` for no transform operations. See the docs app for the full endpoint and signing reference.

## Local Setup

```bash
pnpm install
cp apps/optstuff-dashboard/.env.example apps/optstuff-dashboard/.env
pnpm --filter optstuff-dashboard db:push
```

Run workspace scripts from the repository root:

```bash
pnpm lint
pnpm typecheck
pnpm format
```

## Main Files

| Area | Files |
|------|-------|
| Image API route | `src/app/api/v1/[projectSlug]/[...path]/route.ts` |
| Source URL and operation validation | `src/server/lib/validators.ts`, `src/lib/ipx-utils.ts` |
| Pinned upstream fetch | `src/server/lib/pinned-upstream.ts`, `src/server/lib/ipx-factory.ts` |
| API key crypto | `src/server/lib/api-key.ts` |
| Config cache and rate limits | `src/server/lib/config-cache.ts`, `src/server/lib/rate-limiter.ts` |
| Usage metering and request logs | `src/server/lib/usage-tracker.ts`, `src/server/lib/request-logger.ts` |
