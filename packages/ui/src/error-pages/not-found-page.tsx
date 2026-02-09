import { Button } from "@workspace/ui/components/button";
import { MoveLeft } from "lucide-react";
import { ErrorLayout } from "./error-layout.js";

type NotFoundPageProps = {
  /** The href for the home / primary navigation button. */
  readonly homeHref?: string;
  /** The label shown on the home button. */
  readonly homeLabel?: string;
  /** The brand name displayed in the footer. */
  readonly brandName?: string;
};

/**
 * Shared 404 Not Found page.
 * Displayed when a route segment calls `notFound()` or a URL is not matched.
 */
export function NotFoundPage({
  homeHref = "/",
  homeLabel = "Go Home",
  brandName = "OptStuff",
}: NotFoundPageProps) {
  return (
    <ErrorLayout>
      {/* Compass icon */}
      <div className="mb-8" aria-hidden="true">
        <svg
          width="96"
          height="96"
          viewBox="0 0 80 80"
          fill="none"
          className="text-accent"
        >
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="0.75"
            opacity="0.35"
          />
          <circle
            cx="40"
            cy="40"
            r="24"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.5"
          />
          <line
            x1="40"
            y1="18"
            x2="40"
            y2="62"
            stroke="currentColor"
            strokeWidth="0.75"
            opacity="0.3"
          />
          <line
            x1="18"
            y1="40"
            x2="62"
            y2="40"
            stroke="currentColor"
            strokeWidth="0.75"
            opacity="0.3"
          />
          <path
            d="M40 26L44 38L56 40L44 42L40 54L36 42L24 40L36 38Z"
            stroke="currentColor"
            strokeWidth="1.5"
            opacity="0.6"
          />
          <circle
            cx="40"
            cy="40"
            r="2.5"
            fill="currentColor"
            opacity="0.7"
          />
        </svg>
      </div>

      {/* Large 404 display */}
      <span
        className="mb-4 select-none text-[7rem] font-bold leading-none tracking-tighter text-foreground/5 sm:text-[9rem]"
        aria-hidden="true"
      >
        404
      </span>

      {/* Label */}
      <span className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.2em] text-accent">
        Page Not Found
      </span>

      {/* Heading */}
      <h1 className="mb-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Lost in space
      </h1>

      {/* Description */}
      <p className="mb-10 max-w-sm text-base leading-relaxed text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved
        to a different location.
      </p>

      {/* Action */}
      <Button asChild>
        <a href={homeHref} aria-label={homeLabel}>
          <MoveLeft />
          {homeLabel}
        </a>
      </Button>

      {/* Subtle footer */}
      <div className="mt-12 flex items-center gap-3 text-xs text-muted-foreground/60">
        <div className="h-px w-8 bg-border" />
        <span>{brandName}</span>
        <div className="h-px w-8 bg-border" />
      </div>
    </ErrorLayout>
  );
}
