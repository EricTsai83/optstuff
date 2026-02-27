import dynamic from "next/dynamic";
import { BlurShowcase } from "@/components/blur-showcase";
import { OptStuffImage } from "@/components/optstuff-image";
import { ScrollHeader } from "@/components/scroll-header";
import { getBlurDataUrl } from "@/lib/optstuff";

const FormatComparison = dynamic(
  () => import("@/components/format-comparison").then((m) => m.FormatComparison),
  {
    loading: () => <div className="text-muted text-sm">Loading comparison...</div>,
  },
);

const ResponsiveDemo = dynamic(
  () => import("@/components/responsive-demo").then((m) => m.ResponsiveDemo),
  {
    loading: () => <div className="text-muted text-sm">Loading responsive demo...</div>,
  },
);

const OptimizerPlayground = dynamic(
  () => import("@/components/optimizer-playground").then((m) => m.OptimizerPlayground),
  {
    loading: () => <div className="text-muted text-sm">Loading playground...</div>,
  },
);

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb";

const SHOWCASE_IMAGES = [
  {
    label: "Landscape",
    src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
    format: "webp" as const,
    quality: 80,
  },
  {
    label: "Portrait",
    src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
    format: "avif" as const,
    quality: 85,
  },
  {
    label: "Product",
    src: "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
    format: "webp" as const,
    quality: 90,
  },
  {
    label: "Architecture",
    src: "https://images.unsplash.com/photo-1486325212027-8081e485255e",
    format: "avif" as const,
    quality: 80,
  },
];

export default async function Home() {
  const heroBlurDataUrl = await getBlurDataUrl(HERO_IMAGE, {
    format: "webp",
    quality: 20,
    width: 32,
  });

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* ─── Header ─── */}
      <ScrollHeader>
        <div className="mx-auto grid h-14 max-w-6xl grid-cols-3 items-center px-6">
          <div className="flex items-center gap-2.5">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="size-5 text-emerald-600"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
            </svg>
            <span className="text-foreground text-sm font-semibold tracking-tight">
              OptStuff
            </span>
          </div>
          <nav className="text-muted flex items-center justify-center gap-6 text-sm">
            <a href="#demo" className="hover:text-foreground transition-colors">
              Demo
            </a>
            <a
              href="#how-it-works"
              className="hover:text-foreground transition-colors"
            >
              How it works
            </a>
            <a
              href="#playground"
              className="hover:text-foreground transition-colors"
            >
              Playground
            </a>
          </nav>
          <div className="flex justify-end">
            <a
              href="https://github.com/EricTsai83/optstuff"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-foreground flex items-center gap-1.5 text-sm transition-colors"
            >
              <svg viewBox="0 0 16 16" fill="currentColor" className="size-4">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </ScrollHeader>

      <main>
        {/* ─── Hero ─── */}
        <section className="hero-gradient relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-6 pt-36">
          {/* Decorative floating orbs */}
          <div className="animate-float-slow pointer-events-none absolute -top-20 left-[10%] size-72 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="animate-float bg-teal-400/8 pointer-events-none absolute right-[20%] top-[15%] size-40 rounded-full blur-2xl" />

          {/* Decorative geometric shapes */}
          <div className="animate-float-slow pointer-events-none absolute left-[5%] top-[25%] size-16 rotate-45 rounded-lg border border-emerald-500/15 opacity-60" />
          <div className="animate-float-reverse pointer-events-none absolute bottom-[20%] right-[6%] size-12 rounded-full border border-cyan-500/15 opacity-60" />
          <div className="animate-float pointer-events-none absolute bottom-[35%] left-[8%] size-8 rounded-full border border-teal-500/20 opacity-50" />

          <div className="relative mx-auto max-w-3xl text-center">
            <h1 className="animate-fade-in-up stagger-1 text-foreground mb-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Instant Image Optimization
              <br />
              <span className="text-gradient">with Signed URLs</span>
            </h1>
            <p className="animate-fade-in-up stagger-2 text-muted mx-auto mb-8 max-w-xl text-lg leading-relaxed">
              One secure API to resize, convert, and serve optimised images
              on-the-fly — with blur placeholders built in.
            </p>
          </div>

          {/* Hero blur-to-clear image */}
          <div className="animate-fade-in-up stagger-4 mx-auto w-full max-w-4xl">
            <div className="border-border overflow-hidden rounded-2xl border shadow-xl shadow-black/5">
              <div className="aspect-21/9 relative">
                <OptStuffImage
                  src={HERO_IMAGE}
                  fill
                  sizes="(min-width: 1280px) 1152px, (min-width: 768px) 90vw, 100vw"
                  alt="Mountain landscape with lake — blur-to-clear demo"
                  quality={85}
                  format="webp"
                  fit="cover"
                  preload
                  fallbackText="Hero image unavailable"
                  blurTransitionDuration={800}
                  blurPlaceholder
                  blurDataUrl={heroBlurDataUrl}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ─── Blur-to-Clear Showcase ─── */}
        <BlurShowcase images={SHOWCASE_IMAGES} />

        {/* ─── Format Comparison ─── */}
        <section
          id="formats"
          className="border-border bg-card-hover/30 border-y py-24"
        >
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-4 text-center">
              <span className="mb-3 inline-block rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
                Format Options
              </span>
              <h2 className="text-foreground mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Pick the Right Format
              </h2>
              <p className="text-muted mx-auto max-w-lg">
                OptStuff converts to any format on-the-fly. Choose the best
                trade-off between quality, file size, and browser support — per
                image, per request.
              </p>
            </div>
            <div className="mt-12">
              <FormatComparison />
            </div>
          </div>
        </section>

        {/* ─── Responsive Images ─── */}
        <section id="responsive" className="py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-4 text-center">
              <span className="mb-3 inline-block rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                Any Size, Instantly
              </span>
              <h2 className="text-foreground mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Responsive on Demand
              </h2>
              <p className="text-muted mx-auto max-w-lg">
                No need to pre-generate thumbnails. Request any width and
                OptStuff delivers the exact size needed — from mobile to retina
                displays.
              </p>
            </div>
            <div className="mt-12">
              <ResponsiveDemo />
            </div>
          </div>
        </section>

        {/* ─── Drop-in Replacement ─── */}
        <section className="border-border bg-card-hover/30 border-y py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-12 text-center">
              <span className="mb-3 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                next/image Integration
              </span>
              <h2 className="text-foreground mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Drop-in Replacement
              </h2>
              <p className="text-muted mx-auto max-w-lg">
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-emerald-700 dark:bg-zinc-800 dark:text-emerald-400">
                  {"<OptStuffImage>"}
                </code>{" "}
                wraps{" "}
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-emerald-700 dark:bg-zinc-800 dark:text-emerald-400">
                  next/image
                </code>{" "}
                with server-side URL signing. Full responsive{" "}
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-emerald-700 dark:bg-zinc-800 dark:text-emerald-400">
                  srcSet
                </code>
                , lazy loading, and blur placeholders — all optimised through
                OptStuff.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {SHOWCASE_IMAGES.slice(0, 3).map((img) => (
                <div
                  key={img.label}
                  className="border-border bg-card overflow-hidden rounded-xl border shadow-sm"
                >
                  <div className="aspect-4/3 relative overflow-hidden">
                    <OptStuffImage
                      src={img.src}
                      fill
                      sizes="(min-width: 640px) 33vw, 100vw"
                      alt={img.label}
                      format={img.format}
                      quality={img.quality}
                      blurPlaceholder
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-foreground text-sm font-medium">
                        {img.label}
                      </span>
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        {img.format}
                      </span>
                    </div>
                    <div className="code-block overflow-x-auto rounded-md p-2.5">
                      <pre className="text-code-text font-mono text-[11px] leading-relaxed">
                        <code>{`<OptStuffImage
  src=".../${img.src.split("/").pop()}"
  fill
  format="${img.format}"
  quality={${img.quality}}
  blurPlaceholder
/>`}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How It Works ─── */}
        <section id="how-it-works" className="py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-16 text-center">
              <span className="mb-3 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                Simple &amp; Secure
              </span>
              <h2 className="text-foreground mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
                How It Works
              </h2>
              <p className="text-muted mx-auto max-w-md">
                From URL to optimised image in milliseconds.
              </p>
            </div>

            {/* Horizontal pipeline flow */}
            <div className="border-border bg-card relative rounded-2xl border p-8 shadow-sm sm:p-10">
              {/* Pipeline visualization */}
              <div className="mb-10 flex items-center justify-between">
                {/* Step 1 */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="size-7"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                      />
                    </svg>
                  </div>
                  <span className="text-foreground text-xs font-semibold">
                    Sign
                  </span>
                </div>

                {/* Connector */}
                <div className="bg-linear-to-r mx-2 hidden h-0.5 flex-1 from-emerald-400 to-emerald-300 sm:block" />
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="mx-1 size-4 shrink-0 text-emerald-400 sm:hidden"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                  />
                </svg>

                {/* Step 2 */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-lg shadow-teal-500/20">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="size-7"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                      />
                    </svg>
                  </div>
                  <span className="text-foreground text-xs font-semibold">
                    Transform
                  </span>
                </div>

                {/* Connector */}
                <div className="bg-linear-to-r mx-2 hidden h-0.5 flex-1 from-teal-300 to-cyan-300 sm:block" />
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="mx-1 size-4 shrink-0 text-teal-400 sm:hidden"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                  />
                </svg>

                {/* Step 3 */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-cyan-500 text-white shadow-lg shadow-cyan-500/20">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="size-7"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.75 13.5 10.5 6.75 14.25 10.5 20.25 4.5M20.25 4.5v4.5h-4.5"
                      />
                    </svg>
                  </div>
                  <span className="text-foreground text-xs font-semibold">
                    Cache
                  </span>
                </div>
              </div>

              {/* Detail cards */}
              <div className="border-border grid gap-px overflow-hidden rounded-xl border sm:grid-cols-3">
                <div className="bg-background flex flex-col p-6">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                      1
                    </span>
                    <h3 className="text-foreground font-semibold">
                      Sign on the server
                    </h3>
                  </div>
                  <p className="text-muted mb-4 flex-1 text-sm leading-relaxed">
                    Generate an HMAC-SHA256 signature in your API route. The
                    secret key never leaves the server.
                  </p>
                  <div className="code-block overflow-x-auto rounded-lg p-3">
                    <pre className="text-code-text font-mono text-[11px] leading-relaxed">
                      <code>{`const sig = crypto
  .createHmac("sha256", SECRET)
  .update(path)
  .digest("base64url")
  .substring(0, 32);`}</code>
                    </pre>
                  </div>
                </div>

                <div className="bg-background flex flex-col p-6">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
                      2
                    </span>
                    <h3 className="text-foreground font-semibold">
                      Request any variant
                    </h3>
                  </div>
                  <p className="text-muted mb-4 flex-1 text-sm leading-relaxed">
                    Width, quality, format, fit — everything is in the URL.
                    OptStuff processes on-the-fly.
                  </p>
                  <div className="code-block overflow-x-auto rounded-lg p-3">
                    <pre className="text-code-text font-mono text-[11px] leading-relaxed">
                      <code>{`/api/v1/{slug}/
  w_800,q_80,f_webp,
  fit_cover/
  {image_url}`}</code>
                    </pre>
                  </div>
                </div>

                <div className="bg-background flex flex-col p-6">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-700">
                      3
                    </span>
                    <h3 className="text-foreground font-semibold">
                      Cache forever
                    </h3>
                  </div>
                  <p className="text-muted mb-4 flex-1 text-sm leading-relaxed">
                    Immutable cache headers. CDNs cache at the edge — same URL,
                    same bytes, always.
                  </p>
                  <div className="code-block overflow-x-auto rounded-lg p-3">
                    <pre className="text-code-text font-mono text-[11px] leading-relaxed">
                      <code>{`Cache-Control: public,
  s-maxage=31536000,
  max-age=31536000,
  immutable`}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Playground ─── */}
        <section
          id="playground"
          className="border-border bg-card-hover/30 border-t py-28"
        >
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-14 text-center">
              <span className="mb-3 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                Try It Live
              </span>
              <h2 className="text-foreground mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
                URL Playground
              </h2>
              <p className="text-muted mx-auto max-w-md">
                Configure parameters, preview the result, and get the code — all
                in real-time.
              </p>
            </div>
            <OptimizerPlayground />
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-border border-t py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="text-muted flex items-center gap-2 text-sm">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="size-4 text-emerald-600"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
            </svg>
            OptStuff
          </div>
          <p className="text-muted text-xs">
            Built with Next.js &middot; Tailwind CSS &middot;{" "}
            {process.env.OPTSTUFF_BASE_URL ? (
              <a
                href={process.env.OPTSTUFF_BASE_URL}
                className="text-emerald-600 hover:underline"
              >
                {new URL(process.env.OPTSTUFF_BASE_URL).hostname}
              </a>
            ) : (
              <span className="text-emerald-600">OptStuff</span>
            )}
          </p>
        </div>
      </footer>
    </div>
  );
}
