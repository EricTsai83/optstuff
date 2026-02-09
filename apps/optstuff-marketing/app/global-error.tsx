"use client";

import { useEffect } from "react";

import { GlobalErrorPage } from "@workspace/ui/error-pages/global-error-page";

/**
 * Global error boundary that catches errors in the root layout.
 */
export default function MarketingGlobalError({
  error,
  reset,
}: {
  readonly error: Error & { readonly digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    // TODO: replace with an error-reporting service (e.g. Sentry)
    console.error("[MarketingGlobalError]", error);
  }, [error]);

  return <GlobalErrorPage reset={reset} error={error} />;
}
