# OptStuff + Next.js Example

A standalone Next.js application demonstrating how to integrate [OptStuff](https://optstuff.dev) image optimization API.

## Features

- Server-side HMAC-SHA256 URL signing
- Interactive configuration panel for image operations (resize, format, quality, fit)
- API route for generating signed URLs
- Code examples for `next/image` custom loader integration

## Getting Started

1. **Clone the example**

   ```bash
   git clone https://github.com/optstuff/optstuff.git
   cd optstuff/examples/nextjs
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in your OptStuff credentials from the [dashboard](https://app.optstuff.dev):

   - `OPTSTUFF_BASE_URL` — Your OptStuff instance URL
   - `OPTSTUFF_PROJECT_SLUG` — Your project slug
   - `OPTSTUFF_PUBLIC_KEY` — Public key (`pk_...`)
   - `OPTSTUFF_SECRET_KEY` — Secret key (`sk_...`)

4. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── api/optimize/route.ts   # API route for generating signed URLs
│   ├── layout.tsx
│   ├── page.tsx                 # Interactive demo page
│   └── globals.css
└── lib/
    └── optstuff.ts              # OptStuff URL signing utility
```

## Learn More

- [OptStuff Documentation](https://docs.optstuff.dev)
- [Next.js Documentation](https://nextjs.org/docs)
