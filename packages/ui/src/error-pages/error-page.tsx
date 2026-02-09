"use client";

import { Button } from "@workspace/ui/components/button";
import { Home, RotateCcw } from "lucide-react";
import { ErrorLayout } from "./error-layout.js";

type ErrorPageProps = {
  readonly error: Error & { readonly digest?: string };
  readonly reset: () => void;
  /** The href for the home / primary navigation button. */
  readonly homeHref?: string;
  /** The label shown on the home button. */
  readonly homeLabel?: string;
};

/**
 * Shared error boundary page.
 * Catches runtime errors within route segments.
 */
export function ErrorPage({
  error,
  reset,
  homeHref = "/",
  homeLabel = "Go Home",
}: ErrorPageProps) {
  return (
    <ErrorLayout>
      {/* Geometric accent */}
      <div className="relative mb-8">
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
          className="text-accent"
          aria-hidden="true"
        >
          {/* Outer ring */}
          <circle
            cx="60"
            cy="60"
            r="56"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.2"
          />
          {/* Middle ring - dashed */}
          <circle
            cx="60"
            cy="60"
            r="42"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="6 4"
            opacity="0.3"
          />
          {/* Inner ring */}
          <circle
            cx="60"
            cy="60"
            r="28"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.15"
          />
          {/* Cross lines */}
          <line
            x1="30"
            y1="30"
            x2="90"
            y2="90"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.25"
          />
          <line
            x1="90"
            y1="30"
            x2="30"
            y2="90"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.25"
          />
          {/* Center dot */}
          <circle cx="60" cy="60" r="3" fill="currentColor" opacity="0.4" />
        </svg>
      </div>

      {/* Error label */}
      <span className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.2em] text-accent">
        {error.digest ? `Error · ${error.digest}` : "Runtime Error"}
      </span>

      {/* Heading */}
      <h1 className="mb-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Something went wrong
      </h1>

      {/* Description */}
      <p className="mb-10 max-w-sm text-base leading-relaxed text-muted-foreground">
        An unexpected error occurred while loading this page. You can try
        again or return to the homepage.
      </p>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          onClick={reset}
          aria-label="Try loading the page again"
        >
          <RotateCcw />
          Try Again
        </Button>

        <Button variant="outline" asChild>
          <a href={homeHref} aria-label={homeLabel}>
            <Home />
            {homeLabel}
          </a>
        </Button>
      </div>

      {/* Subtle divider + message */}
      <div className="mt-12 flex items-center gap-3 text-xs text-muted-foreground/60">
        <div className="h-px w-8 bg-border" />
        <span>If this persists, contact support</span>
        <div className="h-px w-8 bg-border" />
      </div>
    </ErrorLayout>
  );
}
