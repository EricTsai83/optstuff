# OptStuff URL Signer (TypeScript + Bun)

Standalone example for generating signed OptStuff image URLs from a TypeScript CLI script.

## Quick start

```bash
cd examples/optstuff-url-signer
cp .env.example .env
```

Edit `.env`:

```bash
OPTSTUFF_BASE_URL=https://your-optstuff-instance.com
OPTSTUFF_PROJECT_SLUG=my-project
OPTSTUFF_PUBLIC_KEY=pk_xxx
OPTSTUFF_SECRET_KEY=sk_xxx
```

Run with defaults:

```bash
bun run sign:url
```

Run with custom options:

```bash
bun run sign:url -- \
  --image-url https://images.unsplash.com/photo-1506744038136-46273834b3fb \
  --width 800 \
  --quality 80 \
  --format avif \
  --fit cover \
  --expires-in 300
```

Show CLI help:

```bash
bun run sign:url -- --help
```
