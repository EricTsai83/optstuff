"use client";

import { GlobalErrorPage } from "@workspace/ui/error-pages/global-error-page";

/**
 * Global error boundary that catches errors in the root layout.
 */
export default function DashboardGlobalError({
  error,
  reset,
}: {
  readonly error: Error & { readonly digest?: string };
  readonly reset: () => void;
}) {
  return (
    <GlobalErrorPage
      reset={reset}
      error={error}
      homeHref="/dashboard"
      homeLabel="Go to Dashboard"
      title="Something went wrong | OptStuff"
    />
  );
}
