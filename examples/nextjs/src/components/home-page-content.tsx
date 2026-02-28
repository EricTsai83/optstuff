import { DeferredMount } from "@/components/deferred-mount";
import { HomeHeader } from "@/components/home-header";
import { HeroRefreshToggle } from "@/components/hero-refresh-toggle";
import { OptStuffImage } from "@/components/optstuff-image";
import { ScrollReveal } from "@/components/scroll-reveal";
import dynamic from "next/dynamic";
import { Fragment } from "react";

const FormatComparison = dynamic(
  () =>
    import("@/components/format-comparison").then((m) => m.FormatComparison),
  {
    loading: () => (
      <div className="text-muted flex min-h-40 items-center justify-center text-sm">
        Loading comparison...
      </div>
    ),
  },
);

const ResponsiveDemo = dynamic(
  () => import("@/components/responsive-demo").then((m) => m.ResponsiveDemo),
  {
    loading: () => (
      <div className="text-muted flex min-h-40 items-center justify-center text-sm">
        Loading responsive demo...
      </div>
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
      <div className="text-muted flex min-h-40 items-center justify-center text-sm">
        Loading playground...
      </div>
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
  readonly heroImageUrl: string;
  readonly heroBlurDataUrl: string | undefined;
  readonly heroBlurMode: "build-cache" | "realtime";
  readonly heroBlurStatus: "available" | "missing";
  readonly heroBlurSource: "network" | "success-cache" | "miss-cache";
  readonly heroBlurNetworkRequested: "yes" | "no";
  readonly heroForceRefresh: "yes" | "no";
  readonly heroBlurReason: string | undefined;
  readonly heroBlurStatusCode: string | undefined;
  readonly heroBlurContentType: string | undefined;
  readonly heroBlurDuration: string | undefined;
  readonly showHeroDebugInfo: boolean;
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
      <HomeHeader />

      <main>
        {/* ─── Hero ─── */}
        <section className="hero-gradient grain-overlay relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-4 pt-28 pb-16 sm:min-h-[88vh] sm:px-6 sm:pt-36 sm:pb-20">
          {/* Decorative orbs */}
          <div className="animate-float-slow pointer-events-none absolute -top-24 left-[8%] size-80 rounded-full bg-emerald-400/8 blur-3xl" />
          <div className="animate-float-reverse pointer-events-none absolute -right-16 bottom-1/4 size-64 rounded-full bg-cyan-400/6 blur-3xl" />

          <div className="relative mx-auto max-w-3xl text-center">
            <span className="animate-fade-in-up stagger-1 badge-pill mb-6 inline-flex bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              <span className="animate-pulse-dot inline-block size-1.5 rounded-full bg-emerald-500" />
              Hero Walkthrough
              <span className="font-mono text-[10px] tracking-wide opacity-70">
                blur → sharp
              </span>
            </span>

            <h1 className="animate-fade-in-up stagger-2 text-foreground mb-6 text-4xl leading-[1.1] font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Instant Image
              <br />
              Optimization
              <br />
              <span className="text-gradient">with Signed URLs</span>
            </h1>

            <p className="animate-fade-in-up stagger-3 text-muted mx-auto mb-10 max-w-xl text-base leading-relaxed sm:text-lg sm:leading-relaxed">
              One secure API to resize, convert, and serve optimised images
              on-the-fly. This hero intentionally demonstrates optional
              blur-to-clear loading.
            </p>
          </div>

          {showHeroDebugInfo ? (
            <div className="animate-fade-in-up stagger-4 mx-auto mb-4 w-full max-w-4xl">
              <HeroRefreshToggle enabled={heroForceRefresh === "yes"} />
            </div>
          ) : null}

          {/* Hero blur-to-clear image */}
          <div className="animate-fade-in-up stagger-5 mx-auto w-full max-w-4xl">
            <div className="border-border group overflow-hidden rounded-2xl border shadow-2xl shadow-black/8 transition-shadow duration-500 hover:shadow-emerald-500/5">
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

            <div className="bg-card/80 border-border mt-4 rounded-xl border px-5 py-4 text-left backdrop-blur-sm">
              <p className="text-foreground text-sm font-medium">
                This demo block uses:
              </p>
              <p className="text-muted mt-1 font-mono text-xs">
                blurPlaceholder + blurDataUrl
              </p>
              {showHeroDebugInfo ? (
                <div className="bg-card-hover/60 border-border mt-3 rounded-lg border p-3">
                  <p className="text-foreground/80 mb-1.5 font-mono text-[11px] font-semibold uppercase tracking-wide">
                    Hero Blur Debug Panel
                  </p>
                  <div className="text-muted grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 font-mono text-xs">
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
                    <summary className="text-foreground/70 hover:text-foreground/90 cursor-pointer font-mono text-[11px] font-semibold uppercase tracking-wide transition-colors">
                      Field Guide
                    </summary>
                    <div className="text-muted mt-2 grid gap-1.5 text-[11px] leading-relaxed">
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
              ) : null}
            </div>
          </div>
        </section>

        {/* ─── Delivery Patterns ─── */}
        <section
          id="demo"
          className="bg-section-alt py-20 sm:py-28"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <ScrollReveal className="mb-6 text-center">
              <span className="badge-pill mb-4 inline-flex bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
                Core Delivery Patterns
              </span>
              <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Format + Responsive, in One Flow
              </h2>
              <p className="text-muted mx-auto max-w-lg text-base leading-relaxed">
                Start by selecting the right output format, then request the
                exact width for each device. Same source image, different
                optimized variants on demand.
              </p>
            </ScrollReveal>

            <div className="mt-10 grid gap-10 sm:mt-14 lg:gap-12">
              <ScrollReveal delay={100}>
                <h3 className="text-foreground mb-4 text-center text-lg font-semibold sm:text-left sm:text-xl">
                  1) Choose an output format
                </h3>
                <FormatComparison />
              </ScrollReveal>

              <ScrollReveal delay={200}>
                <h3 className="text-foreground mb-4 text-center text-lg font-semibold sm:text-left sm:text-xl">
                  2) Deliver the right width
                </h3>
                <ResponsiveDemo />
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ─── Drop-in Replacement ─── */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <ScrollReveal className="mb-12 text-center sm:mb-16">
              <span className="badge-pill mb-4 inline-flex bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                next/image Integration
              </span>
              <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Drop-in Replacement
              </h2>
              <p className="text-muted mx-auto max-w-lg text-base leading-relaxed">
                <code className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-emerald-700 dark:bg-zinc-800 dark:text-emerald-400">
                  {"<OptStuffImage>"}
                </code>{" "}
                wraps{" "}
                <code className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-emerald-700 dark:bg-zinc-800 dark:text-emerald-400">
                  next/image
                </code>{" "}
                with server-side URL signing. Full responsive{" "}
                <code className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-emerald-700 dark:bg-zinc-800 dark:text-emerald-400">
                  srcSet
                </code>{" "}
                and lazy loading through OptStuff.
              </p>
            </ScrollReveal>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {SHOWCASE_IMAGES.map((img, idx) => (
                <ScrollReveal key={img.label} delay={idx * 120}>
                  <div className="feature-card border-border bg-card group cursor-default overflow-hidden rounded-2xl border shadow-sm">
                    <div className="aspect-4/3 relative overflow-hidden">
                      <OptStuffImage
                        src={img.src}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        alt={img.label}
                        format={img.format}
                        quality={img.quality}
                        style={{ objectFit: "cover" }}
                      />
                      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    </div>
                    <div className="p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-foreground text-sm font-semibold">
                          {img.label}
                        </span>
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                          {img.format}
                        </span>
                      </div>
                      <div className="code-block overflow-x-auto rounded-lg p-3">
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
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How It Works ─── */}
        <section
          id="how-it-works"
          className="bg-section-alt py-20 sm:py-28"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <ScrollReveal className="mb-12 text-center sm:mb-16">
              <span className="badge-pill mb-4 inline-flex bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                Simple &amp; Secure
              </span>
              <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                How It Works
              </h2>
              <p className="text-muted mx-auto max-w-md text-base leading-relaxed">
                From URL to optimised image in milliseconds.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="border-border bg-card relative rounded-2xl border p-6 shadow-sm sm:p-10">
                {/* Pipeline visualization */}
                <div className="mb-10 flex flex-col items-center gap-4 sm:mb-12 sm:flex-row sm:justify-between sm:gap-0">
                  {/* Step 1 */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="step-icon flex size-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 sm:size-16">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="size-7 sm:size-8"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                        />
                      </svg>
                    </div>
                    <span className="text-foreground text-sm font-semibold">
                      Sign
                    </span>
                  </div>

                  {/* Connector */}
                  <div className="pipeline-connector bg-linear-to-r mx-2 hidden h-0.5 flex-1 from-emerald-400 to-emerald-300 sm:block" />
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
                  <div className="flex flex-col items-center gap-3">
                    <div className="step-icon flex size-14 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-lg shadow-teal-500/25 sm:size-16">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="size-7 sm:size-8"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                        />
                      </svg>
                    </div>
                    <span className="text-foreground text-sm font-semibold">
                      Transform
                    </span>
                  </div>

                  {/* Connector */}
                  <div className="pipeline-connector bg-linear-to-r mx-2 hidden h-0.5 flex-1 from-teal-300 to-cyan-300 sm:block" />
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
                  <div className="flex flex-col items-center gap-3">
                    <div className="step-icon flex size-14 items-center justify-center rounded-2xl bg-cyan-500 text-white shadow-lg shadow-cyan-500/25 sm:size-16">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="size-7 sm:size-8"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.75 13.5 10.5 6.75 14.25 10.5 20.25 4.5M20.25 4.5v4.5h-4.5"
                        />
                      </svg>
                    </div>
                    <span className="text-foreground text-sm font-semibold">
                      Cache
                    </span>
                  </div>
                </div>

                {/* Detail cards */}
                <div className="border-border grid gap-px overflow-hidden rounded-xl border sm:grid-cols-3">
                  <div className="bg-background flex flex-col p-5 transition-colors hover:bg-emerald-50/30 sm:p-7 dark:hover:bg-emerald-950/10">
                    <div className="mb-3 flex items-center gap-2.5">
                      <span className="flex size-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        1
                      </span>
                      <h3 className="text-foreground font-semibold">
                        Sign on the server
                      </h3>
                    </div>
                    <p className="text-muted mb-5 flex-1 text-sm leading-relaxed">
                      Generate an HMAC-SHA256 signature in your API route. The
                      secret key never leaves the server.
                    </p>
                    <div className="code-block overflow-x-auto rounded-lg p-3.5">
                      <pre className="text-code-text font-mono text-[11px] leading-relaxed">
                        <code>{`const sig = crypto
  .createHmac("sha256", SECRET)
  .update(path)
  .digest("base64url")
  .substring(0, 32);`}</code>
                      </pre>
                    </div>
                  </div>

                  <div className="bg-background flex flex-col p-5 transition-colors hover:bg-teal-50/30 sm:p-7 dark:hover:bg-teal-950/10">
                    <div className="mb-3 flex items-center gap-2.5">
                      <span className="flex size-7 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                        2
                      </span>
                      <h3 className="text-foreground font-semibold">
                        Request any variant
                      </h3>
                    </div>
                    <p className="text-muted mb-5 flex-1 text-sm leading-relaxed">
                      Width, quality, format, fit — everything is in the URL.
                      OptStuff processes on-the-fly.
                    </p>
                    <div className="code-block overflow-x-auto rounded-lg p-3.5">
                      <pre className="text-code-text font-mono text-[11px] leading-relaxed">
                        <code>{`/api/v1/{slug}/
  w_800,q_80,f_webp,
  fit_cover/
  {image_url}`}</code>
                      </pre>
                    </div>
                  </div>

                  <div className="bg-background flex flex-col p-5 transition-colors hover:bg-cyan-50/30 sm:p-7 dark:hover:bg-cyan-950/10">
                    <div className="mb-3 flex items-center gap-2.5">
                      <span className="flex size-7 items-center justify-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
                        3
                      </span>
                      <h3 className="text-foreground font-semibold">
                        Cache forever
                      </h3>
                    </div>
                    <p className="text-muted mb-5 flex-1 text-sm leading-relaxed">
                      Immutable cache headers. CDNs cache at the edge — same
                      URL, same bytes, always.
                    </p>
                    <div className="code-block overflow-x-auto rounded-lg p-3.5">
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
            </ScrollReveal>
          </div>
        </section>

        {/* ─── Playground ─── */}
        <section id="playground" className="py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <ScrollReveal className="mb-12 text-center sm:mb-16">
              <span className="badge-pill mb-4 inline-flex bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                Try It Live
              </span>
              <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                URL Playground
              </h2>
              <p className="text-muted mx-auto max-w-md text-base leading-relaxed">
                Configure parameters, preview the result, and get the code — all
                in real-time.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={100}>
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
            </ScrollReveal>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-border border-t py-10 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="text-muted flex items-center gap-2.5 text-sm">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="size-5 text-emerald-600"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
              </svg>
              <span className="text-foreground font-medium">OptStuff</span>
            </div>
            <p className="text-muted text-center text-xs sm:text-right">
              Built with Next.js · Tailwind CSS ·{" "}
              {process.env.OPTSTUFF_BASE_URL ? (
                <a
                  href={process.env.OPTSTUFF_BASE_URL}
                  className="text-emerald-600 transition-colors hover:text-emerald-500 hover:underline"
                >
                  {new URL(process.env.OPTSTUFF_BASE_URL).hostname}
                </a>
              ) : (
                <span className="text-emerald-600">OptStuff</span>
              )}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
