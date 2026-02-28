"use client";

import { useState } from "react";

type HeroRefreshToggleProps = {
  enabled: boolean;
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
    <div className="border-border bg-card-hover/50 rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-foreground text-sm font-semibold tracking-tight">
            Force Hero Image Refresh
          </p>
          <p className="text-muted mt-1 text-xs leading-relaxed">
            Refreshes both Hero blur and sharp image. It only affects this Hero
            block and does not disable full-page cache.
          </p>
        </div>
        <button
          type="button"
          aria-label="Toggle force hero image refresh"
          aria-pressed={enabled}
          onClick={handleToggle}
          disabled={isPending}
          className="border-border bg-card hover:bg-card-hover text-foreground inline-flex min-w-[128px] items-center justify-center rounded-md border px-3 py-2 font-mono text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending
            ? "updating..."
            : enabled
              ? "force refresh: on"
              : "force refresh: off"}
        </button>
      </div>
    </div>
  );
}
