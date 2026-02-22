import { OptimizerPlayground } from "@/components/optimizer-playground";
import { OptStuffImage } from "@/components/optstuff-image";

const DEMO_IMAGES = [
  {
    label: "Landscape",
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
    format: "webp" as const,
    quality: 80,
  },
  {
    label: "Portrait",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
    format: "avif" as const,
    quality: 85,
  },
  {
    label: "Product",
    url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
    format: "webp" as const,
    quality: 90,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="size-6 text-emerald-600"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
            </svg>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              OptStuff
            </span>
            <span className="rounded-full border border-zinc-200 px-2 py-0.5 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              Next.js Example
            </span>
          </div>
          <a
            href="https://github.com/optstuff/optstuff"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            GitHub
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* Hero */}
        <section className="mb-12 text-center">
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-100">
            Image Optimization API
          </h1>
          <p className="mx-auto max-w-lg text-zinc-500 dark:text-zinc-400">
            Transform, resize, and optimize images on-the-fly with signed URLs.
            This example shows how to integrate OptStuff with Next.js.
          </p>
        </section>

        {/* Image Demo */}
        <section className="mb-16">
          <div className="mb-6 flex items-center gap-3">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Live Demo
            </h2>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              Server-rendered
            </span>
          </div>
          <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
            These images are rendered with{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-emerald-600 dark:bg-zinc-800 dark:text-emerald-400">
              {"<OptStuffImage>"}
            </code>{" "}
            — a wrapper around{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-emerald-600 dark:bg-zinc-800 dark:text-emerald-400">
              next/image
            </code>{" "}
            that signs URLs server-side via an API route. You get full
            responsive <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-emerald-600 dark:bg-zinc-800 dark:text-emerald-400">srcSet</code>,
            priority preloading, and lazy loading — all optimised through
            OptStuff.
          </p>

          <div className="grid gap-6 sm:grid-cols-3">
            {DEMO_IMAGES.map((img) => (
              <div
                key={img.label}
                className="group overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="aspect-4/3 relative overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  <OptStuffImage
                    src={img.url}
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    priority
                    alt={img.label}
                    format={img.format}
                    quality={img.quality}
                    style={{ objectFit: "cover" }}
                    className="transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {img.label}
                    </span>
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      {img.format}
                    </span>
                  </div>
                  <div className="rounded-md bg-zinc-50 p-2.5 dark:bg-zinc-800/50">
                    <pre className="font-mono text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                      <code>{`<OptStuffImage
  src="...unsplash/${img.url.split("/").pop()}"
  fill
  sizes="(min-width: 640px) 33vw, 100vw"
  format="${img.format}"
  quality={${img.quality}}
/>`}</code>
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* URL Playground */}
        <section className="mb-16">
          <h2 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            URL Playground
          </h2>
          <OptimizerPlayground />
        </section>

        {/* Feature Cards */}
        <section>
          <h2 className="mb-8 text-center text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Key Features
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Signed URLs",
                desc: "HMAC-SHA256 signatures prevent unauthorized usage. Generate on the server, use anywhere.",
              },
              {
                title: "Format Conversion",
                desc: "Convert to WebP or AVIF on-the-fly for smaller file sizes without quality loss.",
              },
              {
                title: "Resize & Crop",
                desc: "Specify width, height, and fit mode. Serve the perfect size for every viewport.",
              },
              {
                title: "CDN-Friendly",
                desc: "Content-addressable URLs with long cache headers. Same URL = same output, always.",
              },
              {
                title: "Domain Allowlist",
                desc: "Control which domains can embed your optimized images at both project and key level.",
              },
              {
                title: "Usage Analytics",
                desc: "Track request counts, bandwidth, and popular images through the dashboard.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <h3 className="mb-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 border-t border-zinc-200 pt-8 text-center text-sm text-zinc-400 dark:border-zinc-800">
          <p>
            Built with Next.js &middot; Tailwind CSS &middot;{" "}
            <a
              href="https://optstuff.dev"
              className="text-emerald-600 hover:underline"
            >
              OptStuff
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
