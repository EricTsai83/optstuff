"use client";

import { useState } from "react";

const DEMO_IMAGES = [
  {
    label: "Landscape",
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
  },
  {
    label: "Portrait",
    url: "https://images.unsplash.com/photo-1494790108755-2616b612b786",
  },
  {
    label: "Product",
    url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
  },
];

const FORMATS = ["webp", "avif", "jpg", "png"] as const;
const FIT_MODES = ["cover", "contain", "fill"] as const;

export default function Home() {
  const [imageUrl, setImageUrl] = useState(DEMO_IMAGES[0]!.url);
  const [width, setWidth] = useState(800);
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState<(typeof FORMATS)[number]>("webp");
  const [fit, setFit] = useState<(typeof FIT_MODES)[number]>("cover");
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, width, quality, format, fit }),
      });
      const data = (await res.json()) as { url: string };
      setGeneratedUrl(data.url);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!generatedUrl) return;
    await navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Configuration Panel */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Configuration
            </h2>

            {/* Image Source */}
            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Image Source
              </label>
              <div className="mb-2 flex gap-2">
                {DEMO_IMAGES.map((img) => (
                  <button
                    key={img.label}
                    onClick={() => setImageUrl(img.url)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      imageUrl === img.url
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {img.label}
                  </button>
                ))}
              </div>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            {/* Width & Quality */}
            <div className="mb-5 grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Width (px)
                </label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  min={1}
                  max={4096}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Quality (1-100)
                </label>
                <input
                  type="number"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  min={1}
                  max={100}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
            </div>

            {/* Format */}
            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Output Format
              </label>
              <div className="flex gap-2">
                {FORMATS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors ${
                      format === f
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Fit Mode */}
            <div className="mb-6">
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Fit Mode
              </label>
              <div className="flex gap-2">
                {FIT_MODES.map((m) => (
                  <button
                    key={m}
                    onClick={() => setFit(m)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                      fit === m
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading || !imageUrl}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Signed URL"}
            </button>
          </div>

          {/* Output Panel */}
          <div className="space-y-6">
            {/* Generated URL */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Signed URL
              </h2>
              {generatedUrl ? (
                <div>
                  <div className="relative rounded-lg bg-zinc-950 p-4">
                    <code className="block break-all font-mono text-xs text-emerald-400">
                      {generatedUrl}
                    </code>
                    <button
                      onClick={handleCopy}
                      className="absolute right-2 top-2 rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    This URL is signed with HMAC-SHA256 and expires in 1 hour.
                  </p>
                </div>
              ) : (
                <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-700">
                  <p className="text-sm text-zinc-400">
                    Configure options and click &quot;Generate Signed URL&quot;
                  </p>
                </div>
              )}
            </div>

            {/* Code Example */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Code Example
              </h2>
              <div className="rounded-lg bg-zinc-950 p-4">
                <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-zinc-300">
                  <code>{`// Server Component or API Route
import crypto from "crypto";

const path = "/api/v1/${"{slug}"}/${`w_${width},q_${quality},f_${format},fit_${fit}`}/${"{imageHost/path}"}";
const params = "key=${"{publicKey}"}";

const sig = crypto
  .createHmac("sha256", process.env.OPTSTUFF_SECRET_KEY)
  .update(path + "?" + params)
  .digest("hex");

// Use in <img> or next/image
const url = \`\${OPTSTUFF_URL}\${path}?\${params}&sig=\${sig}\`;`}</code>
                </pre>
              </div>
            </div>

            {/* Next.js Integration */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                next/image Loader
              </h2>
              <div className="rounded-lg bg-zinc-950 p-4">
                <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-zinc-300">
                  <code>{`// next.config.ts
const nextConfig = {
  images: {
    loader: "custom",
    loaderFile: "./src/lib/optstuff-loader.ts",
  },
};

// src/lib/optstuff-loader.ts
export default function optStuffLoader({
  src, width, quality,
}: { src: string; width: number; quality?: number }) {
  const ops = \`w_\${width},q_\${quality ?? 80},f_webp\`;
  return \`\${OPTSTUFF_URL}/api/v1/\${slug}/\${ops}/\${src}\`;
}

// Usage
<Image src="cdn.example.com/photo.jpg"
  width={800} height={600} alt="..." />`}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <section className="mt-16">
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
