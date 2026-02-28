import { DeferredMount } from "@/components/deferred-mount";
import { HomeHeader } from "@/components/home-header";
import { HeroRefreshToggle } from "@/components/hero-refresh-toggle";
import { OptStuffImage } from "@/components/optstuff-image";
import dynamic from "next/dynamic";
import { Fragment } from "react";

const FormatComparison = dynamic(
  () =>
    import("@/components/format-comparison").then((m) => m.FormatComparison),
  {
    loading: () => (
      <div className="text-muted text-sm">Loading comparison...</div>
    ),
  },
);

const ResponsiveDemo = dynamic(
  () => import("@/components/responsive-demo").then((m) => m.ResponsiveDemo),
  {
    loading: () => (
      <div className="text-muted text-sm">Loading responsive demo...</div>
    ),
  },
);

const OptimizerPlayground = dynamic(
  () =>
    import("@/components/optimizer-playground").then(
      (m) => m.OptimizerPlayground,
    ),
  {
    loading: () => (
      <div className="text-muted text-sm">Loading playground...</div>
    ),
  },
);

export const HOME_HERO_IMAGE =
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
];

type HomePageContentProps = {
  heroImageUrl: string;
  heroBlurDataUrl: string | undefined;
  heroBlurMode: "build-cache" | "realtime";
  heroBlurStatus: "available" | "missing";
  heroBlurSource: "network" | "success-cache" | "miss-cache";
  heroBlurNetworkRequested: "yes" | "no";
  heroForceRefresh: "yes" | "no";
  heroBlurReason: string | undefined;
  heroBlurStatusCode: string | undefined;
  heroBlurContentType: string | undefined;
  heroBlurDuration: string | undefined;
  showHeroDebugInfo: boolean;
};

export function HomePageContent({
  heroImageUrl,
  heroBlurDataUrl,
  heroBlurMode,
  heroBlurStatus,
  heroBlurSource,
  heroBlurNetworkRequested,
  heroForceRefresh,
  heroBlurReason,
  heroBlurStatusCode,
  heroBlurContentType,
  heroBlurDuration,
  showHeroDebugInfo,
}: HomePageContentProps) {
  const hasHeroBlurPlaceholder = heroBlurDataUrl !== undefined;
  const heroBlurModeLabel =
    heroBlurMode === "build-cache" ? "build-cache" : "realtime";
  const heroBlurStatusLabel =
    heroBlurStatus === "available" ? "available" : "missing";
  const heroBlurSourceLabel =
    heroBlurSource === "network"
      ? "network"
      : heroBlurSource === "success-cache"
        ? "success cache"
        : "miss cache";
  const heroBlurNetworkRequestedLabel =
    heroBlurNetworkRequested === "yes" ? "yes" : "no";
  const heroBlurForceRefreshLabel = heroForceRefresh === "yes" ? "on" : "off";
  const heroBlurDebugRows = [
    {
      label: "Mode",
      value: heroBlurModeLabel,
      description: "How blur is fetched: cache-first or realtime.",
    },
    {
      label: "Blur Result",
      value: heroBlurStatusLabel,
      description: "Whether a blur placeholder was available.",
    },
    {
      label: "Source",
      value: heroBlurSourceLabel,
      description: "Where this result came from.",
    },
    {
      label: "Network Request",
      value: heroBlurNetworkRequestedLabel,
      description: "Whether this render made a network fetch for blur.",
    },
    {
      label: "Force Refresh",
      value: heroBlurForceRefreshLabel,
      description:
        "Dev toggle that refreshes Hero blur and sharp image URL together.",
    },
    {
      label: "Failure Reason",
      value: heroBlurReason,
      description: "Why blur is missing (if missing).",
    },
    {
      label: "HTTP Status",
      value: heroBlurStatusCode,
      description: "Response status code from blur request.",
    },
    {
      label: "Content Type",
      value: heroBlurContentType,
      description: "Returned content-type for blur request.",
    },
    {
      label: "Duration",
      value: heroBlurDuration,
      description: "Blur fetch duration in milliseconds.",
    },
  ].filter((row) => row.value !== undefined);

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* ─── Header ─── */}
      <HomeHeader />

      <main>
        {/* ─── Hero ─── */}
        <section className="hero-gradient relative flex min-h-[78vh] flex-col items-center justify-center overflow-hidden px-4 pt-28 sm:min-h-[85vh] sm:px-6 sm:pt-36">
          <div className="pointer-events-none absolute -top-20 left-[10%] size-72 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="relative mx-auto max-w-3xl text-center">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              Hero Walkthrough
              <span className="font-mono text-[10px] tracking-wide">
                blur -&gt; sharp
              </span>
            </span>
            <h1 className="animate-fade-in-up stagger-1 text-foreground mb-5 text-3xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Instant Image Optimization
              <br />
              <span className="text-gradient">with Signed URLs</span>
            </h1>
            <p className="animate-fade-in-up stagger-2 text-muted mx-auto mb-8 max-w-xl text-base leading-relaxed sm:text-lg">
              One secure API to resize, convert, and serve optimised images
              on-the-fly. This hero intentionally demonstrates optional
              blur-to-clear loading.
            </p>
          </div>

          {showHeroDebugInfo ? (
            <div className="mx-auto mb-3 w-full max-w-4xl">
              <HeroRefreshToggle enabled={heroForceRefresh === "yes"} />
            </div>
          ) : null}

          {/* Hero blur-to-clear image */}
          <div className="mx-auto w-full max-w-4xl">
            <div className="border-border overflow-hidden rounded-2xl border shadow-xl shadow-black/5">
              <div className="aspect-21/9 relative">
                <OptStuffImage
                  src={heroImageUrl}
                  fill
                  sizes="(min-width: 1280px) 1152px, (min-width: 768px) 90vw, 100vw"
                  alt="Mountain landscape with lake — blur-to-clear demo"
                  quality={85}
                  format="webp"
                  fit="cover"
                  bypassProxy
                  preload
                  blurPlaceholder={hasHeroBlurPlaceholder}
                  blurDataUrl={heroBlurDataUrl}
                />
              </div>
            </div>
            <div className="bg-card/80 border-border mt-3 rounded-xl border px-4 py-3 text-left">
              <p className="text-foreground text-sm font-medium">
                This demo block uses:
              </p>
              <p className="text-muted mt-1 font-mono text-xs">
                blurPlaceholder + blurDataUrl
              </p>
              {showHeroDebugInfo ? (
                <>
                  <div className="bg-card-hover/60 border-border mt-2 rounded-lg border p-2">
                    <p className="text-foreground/80 mb-1 font-mono text-[11px] font-semibold uppercase tracking-wide">
                      Hero Blur Debug Panel
                    </p>
                    <div className="text-muted grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 font-mono text-xs">
                      {heroBlurDebugRows.map((row) => (
                        <Fragment key={row.label}>
                          <span className="text-foreground/85">
                            {row.label}:
                          </span>
                          <span className="text-foreground/85 break-all">
                            {row.value}
                          </span>
                        </Fragment>
                      ))}
                    </div>
                    <details className="border-border mt-3 border-t pt-2">
                      <summary className="text-foreground/70 hover:text-foreground/90 cursor-pointer font-mono text-[11px] font-semibold uppercase tracking-wide">
                        Field Guide
                      </summary>
                      <div className="text-muted mt-2 grid gap-1 text-[11px] leading-relaxed">
                        {heroBlurDebugRows.map((row) => (
                          <p key={`${row.label}-guide`}>
                            <span className="text-foreground/85">
                              {row.label}:
                            </span>{" "}
                            {row.description}
                          </p>
                        ))}
                      </div>
                    </details>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </section>

        {/* ─── Delivery Patterns ─── */}
        <section
          id="demo"
          className="border-border bg-card-hover/30 py-16 sm:py-24"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-4 text-center">
              <span className="mb-3 inline-block rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
                Core Delivery Patterns
              </span>
              <h2 className="text-foreground mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Format + Responsive, in One Flow
              </h2>
              <p className="text-muted mx-auto max-w-lg">
                Start by selecting the right output format, then request the
                exact width for each device. Same source image, different
                optimized variants on demand.
              </p>
            </div>
            <div className="mt-8 grid gap-8 sm:mt-12 lg:gap-10">
              <div>
                <h3 className="text-foreground mb-3 text-center text-lg font-semibold sm:text-left">
                  1) Choose an output format
                </h3>
                <FormatComparison />
              </div>
              <div>
                <h3 className="text-foreground mb-3 text-center text-lg font-semibold sm:text-left">
                  2) Deliver the right width
                </h3>
                <ResponsiveDemo />
              </div>
            </div>
          </div>
        </section>

        {/* ─── Drop-in Replacement ─── */}
        <section className="border-border bg-card-hover/30 border-y py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-10 text-center sm:mb-12">
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
                and lazy loading through OptStuff. Blur placeholders are
                optional and demonstrated in the hero only.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {SHOWCASE_IMAGES.map((img) => (
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
        <section id="how-it-works" className="py-16 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-10 text-center sm:mb-16">
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
            <div className="border-border bg-card relative rounded-2xl border p-5 shadow-sm sm:p-10">
              {/* Pipeline visualization */}
              <div className="mb-8 flex flex-col items-center gap-4 sm:mb-10 sm:flex-row sm:justify-between sm:gap-0">
                {/* Step 1 */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 sm:size-14">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="size-6 sm:size-7"
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
                  className="mx-1 size-5 shrink-0 text-emerald-400 sm:hidden"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v18m0 0-4.5-4.5M12 21l4.5-4.5"
                  />
                </svg>

                {/* Step 2 */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-lg shadow-teal-500/20 sm:size-14">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="size-6 sm:size-7"
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
                  className="mx-1 size-5 shrink-0 text-teal-400 sm:hidden"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v18m0 0-4.5-4.5M12 21l4.5-4.5"
                  />
                </svg>

                {/* Step 3 */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 sm:size-14">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="size-6 sm:size-7"
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
                <div className="bg-background flex flex-col p-5 sm:p-6">
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

                <div className="bg-background flex flex-col p-5 sm:p-6">
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

                <div className="bg-background flex flex-col p-5 sm:p-6">
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
          className="border-border bg-card-hover/30 border-t py-16 sm:py-28"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-10 text-center sm:mb-14">
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
            <DeferredMount
              rootMargin="400px 0px"
              placeholder={
                <div className="border-border bg-card text-muted flex min-h-64 items-center justify-center rounded-2xl border px-6 text-sm">
                  Scroll to load playground...
                </div>
              }
            >
              <OptimizerPlayground />
            </DeferredMount>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-border border-t py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
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
