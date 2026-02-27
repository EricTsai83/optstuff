import { buildOptStuffProxyPath } from "@/lib/next-image-optstuff-loader";

const DEMO_SRC =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb";

const FORMATS = [
  {
    id: "webp" as const,
    label: "WebP",
    badge: "Best balance",
    badgeColor:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    description:
      "Excellent compression with broad browser support. Ideal for most web use cases.",
  },
  {
    id: "avif" as const,
    label: "AVIF",
    badge: "Smallest size",
    badgeColor:
      "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
    description:
      "Next-gen codec with best-in-class compression. Great for bandwidth-constrained users.",
  },
  {
    id: "jpg" as const,
    label: "JPEG",
    badge: "Universal",
    badgeColor:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    description:
      "Maximum compatibility across all browsers and devices. The safe default.",
  },
  {
    id: "png" as const,
    label: "PNG",
    badge: "Lossless",
    badgeColor:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    description:
      "Lossless compression preserving every pixel. Best for graphics and transparency.",
  },
];

function buildUrl(src: string, format: string, width: number, quality: number) {
  return buildOptStuffProxyPath({
    src,
    width,
    quality,
    format: format as "webp" | "avif" | "png" | "jpg",
    fit: "cover",
  });
}

export function FormatComparison() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {FORMATS.map((fmt) => {
        const previewUrl = buildUrl(DEMO_SRC, fmt.id, 600, 80);

        return (
          <div
            key={fmt.id}
            className="feature-card group cursor-pointer overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:border-emerald-500/50 hover:ring-2 hover:ring-emerald-500/20"
          >
            <div className="relative aspect-4/3 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={`${fmt.label} format preview`}
                width={600}
                height={450}
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute left-3 top-3">
                <span className="rounded-md bg-black/60 px-2 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                  .{fmt.id}
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-foreground text-sm font-semibold">
                  {fmt.label}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${fmt.badgeColor}`}
                >
                  {fmt.badge}
                </span>
              </div>
              <p className="text-muted text-xs leading-relaxed">
                {fmt.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
