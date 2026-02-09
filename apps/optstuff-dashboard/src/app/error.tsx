"use client";

import { ErrorPage } from "@workspace/ui/error-pages/error-page";

/**
 * Error boundary for child routes.
 * Catches runtime errors within the app's route segments.
 */
export default function DashboardErrorPage({
  error,
  reset,
}: {
  readonly error: Error & { readonly digest?: string };
  readonly reset: () => void;
}) {
  return (
    <ErrorPage
      error={error}
      reset={reset}
      homeHref="/dashboard"
      homeLabel="Go to Dashboard"
    />
  );
}
