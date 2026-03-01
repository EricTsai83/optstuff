"use client";

import { useState } from "react";

type HeroRefreshToggleProps = {
  readonly enabled: boolean;
};

export function HeroRefreshToggle({ enabled }: HeroRefreshToggleProps) {
  const [isPending, setIsPending] = useState(false);

  function handleToggle() {
    if (typeof window === "undefined") {
      return;
    }

    setIsPending(true);
    const nextUrl = new URL(window.location.href);
    if (enabled) {
      nextUrl.searchParams.delete("hero-refresh");
      nextUrl.searchParams.delete("blur-bust");
    } else {
      nextUrl.searchParams.set("hero-refresh", "1");
      nextUrl.searchParams.delete("blur-bust");
    }

    window.location.replace(nextUrl.toString());
  }

  return (
    <div className="border-border bg-card/60 rounded-xl border p-4 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-foreground text-sm font-semibold tracking-tight">
            Hero Request Mode
          </p>
          <p className="text-muted mt-1 text-xs leading-relaxed">
            Switch this Hero block between normal cache behavior and a forced
            fresh request.
          </p>
        </div>
        <button
          type="button"
          aria-label="Toggle hero request mode"
          aria-pressed={enabled}
          onClick={handleToggle}
          disabled={isPending}
          className={`inline-flex min-w-[140px] items-center justify-center rounded-lg border px-4 py-2.5 font-mono text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
            enabled
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
              : "border-border bg-card text-foreground hover:bg-card-hover"
          }`}
        >
          {isPending
            ? "updating..."
            : enabled
              ? "request: fresh"
              : "request: cached"}
        </button>
      </div>
    </div>
  );
}
