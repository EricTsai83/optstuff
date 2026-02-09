"use client";

import { useEffect } from "react";

type GlobalErrorPageProps = {
  readonly reset: () => void;
  /** The caught error, used for centralized logging. */
  readonly error: (Error & { readonly digest?: string }) | undefined;
  /** The href for the home / primary navigation link. */
  readonly homeHref?: string;
  /** The label shown on the home link. */
  readonly homeLabel?: string;
  /** The page `<title>` displayed in the browser tab. */
  readonly title?: string;
};

/**
 * Shared global error boundary page.
 * Catches errors in the root layout itself.
 *
 * Uses only inline styles because the root layout's CSS pipeline
 * may not be available when this renders.
 */
export function GlobalErrorPage({
  reset,
  error,
  homeHref = "/",
  homeLabel = "Go Home",
  title = "Something went wrong | OptStuff",
}: GlobalErrorPageProps) {
  useEffect(() => {
    if (error) {
      console.error("[GlobalErrorPage]", error);
    }
  }, [error]);
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        style={{
          margin: 0,
          padding: "1rem",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f1117",
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          color: "#f5f5f7",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Background grid */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage:
              "radial-gradient(ellipse 60% 60% at 50% 50%, black 20%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 60% 60% at 50% 50%, black 20%, transparent 70%)",
          }}
        />

        {/* Gradient orb */}
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(220, 60, 60, 0.08) 0%, transparent 70%)",
            filter: "blur(80px)",
            pointerEvents: "none",
          }}
        />

        {/* Card */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth: "420px",
            background: "rgba(24, 26, 36, 0.8)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "1rem",
            padding: "2.5rem 2rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          {/* Icon circle */}
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "rgba(220, 60, 60, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.25rem",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#dc3c3c"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          {/* Badge */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "rgba(245,245,247,0.6)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "9999px",
              padding: "2px 10px",
              marginBottom: "1.5rem",
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            }}
          >
            System Error
          </span>

          {/* Heading */}
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              lineHeight: 1.3,
              margin: "0 0 0.5rem",
              letterSpacing: "-0.02em",
            }}
          >
            Something went wrong
          </h1>

          {/* Description */}
          <p
            style={{
              fontSize: "0.875rem",
              lineHeight: 1.6,
              color: "rgba(245, 245, 247, 0.45)",
              margin: "0 0 2rem",
              maxWidth: "320px",
            }}
          >
            An unexpected error has occurred. Our team has been notified and is
            working on a fix.
          </p>

          {/* Try Again button */}
          <button
            onClick={reset}
            type="button"
            style={{
              width: "100%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              padding: "0.625rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#0f1117",
              background: "#f5f5f7",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
              transition: "background 150ms ease",
              fontFamily: "inherit",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(245,245,247,0.85)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#f5f5f7";
            }}
            onFocus={(e) => {
              e.currentTarget.style.background = "rgba(245,245,247,0.85)";
              if (e.currentTarget.matches(":focus-visible")) {
                e.currentTarget.style.outline =
                  "2px solid rgba(245,245,247,0.6)";
                e.currentTarget.style.outlineOffset = "2px";
              }
            }}
            onBlur={(e) => {
              e.currentTarget.style.background = "#f5f5f7";
              e.currentTarget.style.outline = "none";
              e.currentTarget.style.outlineOffset = "0";
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="1 4 1 10 7 10" />
              <polyline points="23 20 23 14 17 14" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10" />
              <path d="M3.51 15A9 9 0 0 0 18.36 18.36L23 14" />
            </svg>
            Try Again
          </button>

          {/* Go Home link */}
          <a
            href={homeHref}
            style={{
              width: "100%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              padding: "0.625rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "rgba(245,245,247,0.7)",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "0.5rem",
              cursor: "pointer",
              transition: "background 150ms ease, border-color 150ms ease",
              fontFamily: "inherit",
              textDecoration: "none",
              marginTop: "0.5rem",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
            }}
            onFocus={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
              if (e.currentTarget.matches(":focus-visible")) {
                e.currentTarget.style.outline =
                  "2px solid rgba(245,245,247,0.5)";
                e.currentTarget.style.outlineOffset = "2px";
              }
            }}
            onBlur={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
              e.currentTarget.style.outline = "none";
              e.currentTarget.style.outlineOffset = "0";
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            {homeLabel}
          </a>

          {/* Divider */}
          <div
            style={{
              width: "100%",
              height: "1px",
              background: "rgba(255,255,255,0.06)",
              margin: "1.5rem 0 1rem",
            }}
          />

          {/* Footer text */}
          <p
            style={{
              fontSize: "0.75rem",
              color: "rgba(245,245,247,0.3)",
              margin: 0,
            }}
          >
            If this persists, please contact support
          </p>
        </div>
      </body>
    </html>
  );
}
