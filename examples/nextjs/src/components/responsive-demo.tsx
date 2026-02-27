"use client";

import { useState } from "react";

const DEMO_SRC =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb";

const VARIANTS = [
  {
    width: 320,
    label: "320px",
    device: "Mobile",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="size-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
        />
      </svg>
    ),
  },
  {
    width: 640,
    label: "640px",
    device: "Tablet",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="size-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.5 19.5h3m-6.75 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-15a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 4.5v15a2.25 2.25 0 0 0 2.25 2.25Z"
        />
      </svg>
    ),
  },
  {
    width: 1024,
    label: "1024px",
    device: "Desktop",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="size-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25Z"
        />
      </svg>
    ),
  },
  {
    width: 1920,
    label: "1920px",
    device: "Retina",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="size-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z"
        />
      </svg>
    ),
  },
];

function buildUrl(src: string, width: number) {
  const params = new URLSearchParams({
    url: src,
    w: String(width),
    q: "80",
    f: "webp",
    fit: "cover",
  });
  return `/api/optstuff?${params}`;
}

export function ResponsiveDemo() {
  const [selected, setSelected] = useState(1);

  return (
    <div className="space-y-8">
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-max items-center justify-center gap-2">
          {VARIANTS.map((v, i) => (
            <button
              key={v.width}
              onClick={() => setSelected(i)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-all sm:px-4 ${
                selected === i
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                  : "bg-card-hover text-muted hover:text-foreground"
              }`}
            >
              {v.icon}
              <span className="hidden sm:inline">{v.device}</span>
              <span className="font-mono text-xs opacity-70">{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="border-border bg-card overflow-hidden rounded-2xl border shadow-sm">
        <div className="border-border flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="size-2.5 rounded-full bg-red-400/60" />
              <div className="size-2.5 rounded-full bg-amber-400/60" />
              <div className="size-2.5 rounded-full bg-emerald-400/60" />
            </div>
            <span className="text-muted ml-2 text-xs">
              {VARIANTS[selected]!.device} Preview
            </span>
          </div>
          <span className="text-muted font-mono text-[11px] sm:text-xs">
            w_{VARIANTS[selected]!.width},q_80,f_webp
          </span>
        </div>
        <div className="flex items-center justify-center bg-card-hover/50 p-4 sm:p-8">
          <div
            className="overflow-hidden rounded-lg border border-border shadow-lg transition-all duration-500"
            style={{
              width: `min(${VARIANTS[selected]!.width}px, 100%)`,
              maxWidth: "100%",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={VARIANTS[selected]!.width}
              src={buildUrl(DEMO_SRC, VARIANTS[selected]!.width)}
              alt={`${VARIANTS[selected]!.device} variant`}
              className="aspect-4/3 w-full object-cover"
            />
          </div>
        </div>
      </div>

      <div className="code-block mx-auto max-w-2xl overflow-x-auto rounded-xl p-4">
        <pre className="text-code-text font-mono text-xs leading-relaxed">
          <code>{`<OptStuffImage
  src="photo.jpg"
  width={${VARIANTS[selected]!.width}}
  sizes="(max-width: ${VARIANTS[selected]!.width}px) 100vw, ${VARIANTS[selected]!.width}px"
  format="webp"
  quality={80}
/>`}</code>
        </pre>
      </div>
    </div>
  );
}
