import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getProxyAllowedDomains, isDomainAllowed } from "@/lib/allowed-domains";

/**
 * Create 403 Forbidden response
 */
function createForbiddenResponse(message: string): NextResponse {
  return new NextResponse(JSON.stringify({ error: message }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}

export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!pathname.startsWith("/api/optimize")) {
    return NextResponse.next();
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");
  const secFetchSite = request.headers.get("sec-fetch-site");
  const secFetchMode = request.headers.get("sec-fetch-mode");
  const secFetchDest = request.headers.get("sec-fetch-dest");
  const allowedDomains = getProxyAllowedDomains();

  // Allow direct navigation (typing URL in browser) and image embeds (<img> tags)
  // These are legitimate use cases for an image optimization API
  if (secFetchMode === "navigate" || secFetchDest === "image") {
    return NextResponse.next();
  }

  // 1. Check Sec-Fetch-Site header (automatically set by modern browsers, cannot be forged)
  if (
    secFetchSite &&
    secFetchSite !== "same-origin" &&
    secFetchSite !== "same-site"
  ) {
    return createForbiddenResponse(
      "Forbidden: Cross-site requests are not allowed",
    );
  }

  // 2. Check Origin header
  if (origin && !isDomainAllowed(origin, allowedDomains)) {
    return createForbiddenResponse("Forbidden: Invalid Origin");
  }

  // 3. Check Referer header
  if (referer && !isDomainAllowed(referer, allowedDomains)) {
    return createForbiddenResponse("Forbidden: Invalid Referer");
  }

  // 4. If no Origin and no Referer, and not same-origin request, reject
  if (!origin && !referer && secFetchSite !== "same-origin") {
    const requestHost = host?.split(":")[0];
    const isLocalhost =
      requestHost === "localhost" || requestHost === "127.0.0.1";

    // Allow localhost in development environment
    if (process.env.NODE_ENV === "development" && isLocalhost) {
      return NextResponse.next();
    }

    return createForbiddenResponse(
      "Forbidden: Direct API access is not allowed",
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/optimize/:path*",
};
