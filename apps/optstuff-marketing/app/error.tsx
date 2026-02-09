"use client";

import { ErrorPage } from "@workspace/ui/error-pages/error-page";

/**
 * Error boundary for child routes.
 * Catches runtime errors within the marketing site's route segments.
 */
export default function MarketingErrorPage({
  error,
  reset,
}: {
  readonly error: Error & { readonly digest?: string };
  readonly reset: () => void;
}) {
  return <ErrorPage error={error} reset={reset} />;
}
