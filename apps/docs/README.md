# OptStuff Docs

Fumadocs + Next.js documentation site for OptStuff.

## Content

Documentation pages live in `content/docs`. The sidebar order is controlled by the nearest `meta.json` file, and routes are generated from MDX file paths.

## Local Commands

Run from the repository root:

```bash
pnpm --filter optstuff-docs typecheck
pnpm --filter optstuff-docs lint
```

The docs development server uses port `3002` when started through the package `dev` script.

## Main Files

| Area | Files |
|------|-------|
| Source config | `source.config.ts`, `lib/source.ts` |
| Shared layout options | `lib/layout.shared.tsx` |
| Docs route | `app/(docs)/[[...slug]]/page.tsx` |
| Search route | `app/api/search/route.ts` |
| LLM text routes | `app/llms.txt/route.ts`, `app/llms-full.txt/route.ts`, `app/llms.mdx/[[...slug]]/route.ts` |
