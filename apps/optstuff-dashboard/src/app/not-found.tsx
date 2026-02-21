import { NotFoundPage } from "@workspace/ui/error-pages/not-found-page";

/**
 * Custom 404 Not Found page.
 * Displayed when a route segment calls `notFound()` or a URL is not matched.
 */
export default function DashboardNotFoundPage() {
  return <NotFoundPage homeHref="/dashboard" homeLabel="Back to Dashboard" />;
}
