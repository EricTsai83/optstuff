"use client";

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
  const params = new URLSearchParams({
    url,
    w: String(width),
    q: String(quality),
    f: format,
    fit,
  });
  return `/api/optstuff?${params}`;
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

  const previewUrl = buildPreviewUrl(imageUrl, width, quality, format, fit);

  async function handleGenerate() {
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

  const chipActive =
    "bg-emerald-500 text-white shadow-sm";
  const chipInactive =
    "text-muted hover:text-foreground";

  return (
    <div className="space-y-6">
      {/* ─── Top: Controls + Preview side by side ─── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Controls */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-5 text-base font-semibold text-foreground">Configuration</h3>

          {/* Image source */}
          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-medium text-muted">Image Source</label>
            <div className="mb-2 flex gap-2">
              {DEMO_IMAGES.map((img) => (
                <button
                  key={img.label}
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
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Width + Quality */}
          <div className="mb-5 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted">Width (px)</label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                min={1}
                max={4096}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted">Quality</label>
              <input
                type="number"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                min={1}
                max={100}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Format + Fit inline */}
          <div className="mb-5 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted">Format</label>
              <div className="grid grid-cols-4 gap-1 rounded-lg bg-card-hover p-1">
                {FORMATS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`rounded-md py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all ${
                      format === f ? chipActive : chipInactive
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted">Fit</label>
              <div className="grid grid-cols-3 gap-1 rounded-lg bg-card-hover p-1">
                {FIT_MODES.map((m) => (
                  <button
                    key={m}
                    onClick={() => setFit(m)}
                    className={`rounded-md py-1.5 text-[11px] font-semibold capitalize transition-all ${
                      fit === m ? chipActive : chipInactive
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generate */}
          <button
            onClick={handleGenerate}
            disabled={loading || !imageUrl}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Signed URL"}
          </button>
        </div>

        {/* Image Preview */}
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h3 className="text-sm font-semibold text-foreground">Preview</h3>
            <div className="flex items-center gap-3 text-xs text-muted">
              <span>{width}px</span>
              <span className="text-border">|</span>
              <span>q{quality}</span>
              <span className="text-border">|</span>
              <span className="uppercase">{format}</span>
              <span className="text-border">|</span>
              <span>{fit}</span>
            </div>
          </div>
          <div className="p-4">
            <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-card-hover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={previewUrl}
                src={previewUrl}
                alt="Preview"
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Bottom: Signed URL output ─── */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Signed URL</h3>
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/30">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        ) : generatedUrl ? (
          <div>
            <div className="code-block relative overflow-x-auto rounded-lg p-4">
              <code className="block break-all font-mono text-xs leading-relaxed text-emerald-400">
                {generatedUrl}
              </code>
              <button
                onClick={handleCopy}
                className="absolute right-3 top-3 rounded-md bg-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-600"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="mt-2 text-xs text-muted">
              Signed with HMAC-SHA256 — expires in 1 hour.
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border py-6">
            <p className="text-sm text-muted">
              Click &quot;Generate Signed URL&quot; to create a signed URL
            </p>
          </div>
        )}
      </div>

      {/* ─── Code Example ─── */}
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-3">
          <h3 className="text-sm font-semibold text-foreground">Code Example</h3>
        </div>
        <div className="code-block rounded-none border-0 p-5">
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-code-text">
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
