import type { ReactNode } from "react";

type ErrorLayoutProps = {
  readonly children: ReactNode;
};

/**
 * Shared background layout for error pages.
 *
 * Renders the background grid, gradient glow, and centered content container
 * used by {@link import("./error-page").ErrorPage} and
 * {@link import("./not-found-page").NotFoundPage}.
 *
 * Not used by `GlobalErrorPage` which relies on inline styles
 * because the root layout's CSS pipeline may not be available.
 */
export function ErrorLayout({ children }: ErrorLayoutProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6">
      {/* Background grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 50% 50% at 50% 50%, black 20%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 50% 50% at 50% 50%, black 20%, transparent 70%)",
        }}
      />

      {/* Gradient glow */}
      <div className="pointer-events-none fixed left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/6 blur-[100px]" />

      {/* Content */}
      <div className="relative z-10 flex max-w-lg flex-col items-center text-center">
        {children}
      </div>
    </div>
  );
}
