# Image Optimizer

A high-performance image optimization API built with [Next.js](https://nextjs.org) and [IPX](https://github.com/unjs/ipx).

## Getting Started

```bash
# Install dependencies
bun install

# Start development server
bun run dev
```

## Image Optimization API

### URL Format

```
/api/optimize/{operations}/{image_url}
```

### Quick Examples

```bash
# Set width to 800px
/api/optimize/w_800/https://images.unsplash.com/photo-1506905925346-21bda4d32df4

# WebP format + quality 80
/api/optimize/f_webp,q_80/https://images.unsplash.com/photo-1506905925346-21bda4d32df4

# Resize + crop
/api/optimize/s_400x300,fit_cover/https://images.unsplash.com/photo-1506905925346-21bda4d32df4

# No operation (original image)
/api/optimize/_/https://images.unsplash.com/photo-1506905925346-21bda4d32df4
```

### Common Operations

| Operation | Description | Example |
|-----------|-------------|---------|
| `w_{n}` | Width | `w_800` |
| `h_{n}` | Height | `h_600` |
| `s_{w}x{h}` | Resize | `s_800x600` |
| `q_{n}` | Quality | `q_80` |
| `f_{format}` | Format | `f_webp`, `f_avif` |
| `fit_{mode}` | Fit mode | `fit_cover` |
| `_` | No operation | `_` |

### Full Documentation

For all available operations, see the IPX documentation:

👉 **[https://github.com/unjs/ipx](https://github.com/unjs/ipx)**

### React Example

```tsx
const OptimizedImage = ({ src }: { readonly src: string }) => {
  return (
    <img
      src={`/api/optimize/w_800,f_webp,q_80/${src}`}
      alt="Optimized"
      loading="lazy"
    />
  );
};
```

## Tech Stack

- [Next.js](https://nextjs.org) - React framework
- [IPX](https://github.com/unjs/ipx) - Image optimizer powered by sharp
- [tRPC](https://trpc.io) - End-to-end typesafe APIs
- [Drizzle](https://orm.drizzle.team) - TypeScript ORM
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS
