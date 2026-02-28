"use client";

import { buildOptStuffProxyPath } from "@/lib/next-image-optstuff-loader";
import { useState } from "react";

const DEMO_IMAGES = [
  {
    label: "Landscape",
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
  },
  {
    label: "Portrait",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
  },
  {
    label: "Product",
    url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
  },
];

const FORMATS = ["webp", "avif", "jpg", "png"] as const;
const FIT_MODES = ["cover", "contain", "fill"] as const;

function buildPreviewUrl(
  url: string,
  width: number,
  quality: number,
  format: string,
  fit: string,
) {
  return buildOptStuffProxyPath({
    src: url,
    width,
    quality,
    format: format as "webp" | "avif" | "png" | "jpg",
    fit: fit as "cover" | "contain" | "fill",
  });
}

export function OptimizerPlayground() {
  const [imageUrl, setImageUrl] = useState(DEMO_IMAGES[0]!.url);
  const [width, setWidth] = useState(800);
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState<(typeof FORMATS)[number]>("webp");
  const [fit, setFit] = useState<(typeof FIT_MODES)[number]>("cover");
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const hasInput = imageUrl.trim() !== "";
  const previewUrl = hasInput
    ? buildPreviewUrl(imageUrl, width, quality, format, fit)
    : null;

  async function handleGenerate() {
    if (!hasInput) return;
    setLoading(true);
    setError(null);
    setGeneratedUrl(null);
    try {
      const res = await fetch("/api/optstuff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, width, quality, format, fit }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message =
          (body as { error?: string } | null)?.error ??
          `Request failed (${res.status})`;
        setError(message);
        return;
      }
      const data = (await res.json()) as { url: string };
      setGeneratedUrl(data.url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy the URL below:", generatedUrl);
    }
  }

  const chipActive = "bg-emerald-500 text-white shadow-sm";
  const chipInactive =
    "text-muted hover:text-foreground hover:bg-card-hover/60";

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration panel */}
        <div className="border-border bg-card rounded-2xl border p-5 shadow-sm sm:p-6">
          <h3 className="text-foreground mb-5 text-base font-semibold">
            Configuration
          </h3>

          {/* Image source */}
          <div className="mb-5">
            <label className="text-muted mb-2 block text-sm font-medium">
              Image Source
            </label>
            <div className="mb-2.5 flex flex-wrap gap-2">
              {DEMO_IMAGES.map((img) => (
                <button
                  key={img.label}
                  type="button"
                  onClick={() => setImageUrl(img.url)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    imageUrl === img.url
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "bg-card-hover text-muted hover:text-foreground"
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
              aria-label="Image URL"
              className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Width & Quality */}
          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-muted mb-2 block text-sm font-medium">
                Width (px)
              </label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                min={1}
                max={4096}
                aria-label="Image width"
                className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="text-muted mb-2 block text-sm font-medium">
                Quality
              </label>
              <input
                type="number"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                min={1}
                max={100}
                aria-label="Image quality"
                className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Format & Fit */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-muted mb-2 block text-sm font-medium">
                Format
              </label>
              <div className="bg-card-hover grid grid-cols-4 gap-1 rounded-lg p-1">
                {FORMATS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    aria-label={`Format: ${f}`}
                    className={`rounded-md py-2 text-[11px] font-semibold uppercase tracking-wider transition-all ${
                      format === f ? chipActive : chipInactive
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-muted mb-2 block text-sm font-medium">
                Fit
              </label>
              <div className="bg-card-hover grid grid-cols-3 gap-1 rounded-lg p-1">
                {FIT_MODES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setFit(m)}
                    aria-label={`Fit: ${m}`}
                    className={`rounded-md py-2 text-[11px] font-semibold capitalize transition-all ${
                      fit === m ? chipActive : chipInactive
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !hasInput}
            className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:shadow-emerald-600/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? "Generating..." : "Generate Signed URL"}
          </button>
        </div>

        {/* Preview panel */}
        <div className="border-border bg-card rounded-2xl border shadow-sm">
          <div className="border-border flex flex-col items-start justify-between gap-2 border-b px-5 py-3.5 sm:flex-row sm:items-center">
            <h3 className="text-foreground text-sm font-semibold">Preview</h3>
            <div className="text-muted flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <span>{width}px</span>
              <span className="text-border">|</span>
              <span>q{quality}</span>
              <span className="text-border">|</span>
              <span className="uppercase">{format}</span>
              <span className="text-border">|</span>
              <span>{fit}</span>
            </div>
          </div>
          <div className="p-3 sm:p-4">
            <div className="bg-card-hover relative aspect-4/3 overflow-hidden rounded-lg">
              {previewUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={previewUrl}
                  src={previewUrl}
                  alt="Preview"
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                  className="h-full w-full object-contain transition-opacity duration-300"
                />
              ) : (
                <div className="text-muted flex h-full items-center justify-center text-sm">
                  Enter an image URL to preview
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Signed URL output */}
      <div className="border-border bg-card rounded-2xl border p-5 shadow-sm sm:p-6">
        <h3 className="text-foreground mb-3 text-sm font-semibold">
          Signed URL
        </h3>
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        ) : generatedUrl ? (
          <div>
            <div className="code-block relative overflow-x-auto rounded-lg p-4">
              <code className="block break-all font-mono text-xs leading-relaxed text-emerald-400">
                {generatedUrl}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="absolute right-3 top-3 rounded-md bg-zinc-700 px-2.5 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-600"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-muted mt-2 text-xs">
              Signed with HMAC-SHA256 — expires in 1 hour.
            </p>
          </div>
        ) : (
          <div className="border-border flex items-center justify-center rounded-lg border-2 border-dashed py-8">
            <p className="text-muted text-sm">
              Click &quot;Generate Signed URL&quot; to create a signed URL
            </p>
          </div>
        )}
      </div>

      {/* Code example */}
      <div className="border-border bg-card overflow-hidden rounded-2xl border shadow-sm">
        <div className="border-border border-b px-5 py-3.5 sm:px-6">
          <h3 className="text-foreground text-sm font-semibold">
            Code Example
          </h3>
        </div>
        <div className="code-block rounded-none border-0 p-4 sm:p-5">
          <pre className="text-code-text overflow-x-auto font-mono text-xs leading-relaxed">
            <code>{`import { OptStuffImage } from "@/components/optstuff-image";

<OptStuffImage
  src="${imageUrl.length > 50 ? imageUrl.substring(0, 50) + "..." : imageUrl}"
  width={${width}}
  height={${Math.round(width * 0.625)}}
  alt="Optimised photo"
  format="${format}"
  quality={${quality}}
  blurPlaceholder
/>`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
