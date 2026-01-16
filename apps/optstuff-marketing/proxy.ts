import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 定義允許的網域列表
 * 生產環境通常來自環境變數
 */
function getAllowedDomains(): string[] {
  const envDomains = process.env.ALLOWED_DOMAINS;
  if (envDomains) {
    return envDomains.split(",").map((d) => d.trim());
  }
  // 預設允許的網域
  return ["localhost", "127.0.0.1", "optstuff.com", "www.optstuff.com"];
}

/**
 * 檢查網域是否在允許列表中
 */
function isDomainAllowed(
  url: string | null,
  allowedDomains: string[],
): boolean {
  if (!url) return false;

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;

    return allowedDomains.some((domain) => {
      // 精確匹配或子網域匹配
      return hostname === domain || hostname.endsWith(`.${domain}`);
    });
  } catch {
    return false;
  }
}

/**
 * 創建 403 Forbidden 回應
 */
function createForbiddenResponse(message: string): NextResponse {
  return new NextResponse(JSON.stringify({ error: message }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 針對 /api/optimize 路徑進行嚴格檢查
  if (pathname.startsWith("/api/optimize")) {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const host = request.headers.get("host");
    const secFetchSite = request.headers.get("sec-fetch-site");

    const allowedDomains = getAllowedDomains();

    // 1. 檢查 Sec-Fetch-Site header (現代瀏覽器會自動帶上，無法偽造)
    // same-origin: 同源請求
    // same-site: 同站請求
    // cross-site: 跨站請求
    // none: 直接導航 (如在網址列輸入)
    if (
      secFetchSite &&
      secFetchSite !== "same-origin" &&
      secFetchSite !== "same-site"
    ) {
      return createForbiddenResponse(
        "Forbidden: Cross-site requests are not allowed",
      );
    }

    // 2. 檢查 Origin header (瀏覽器自動帶上)
    if (origin) {
      if (!isDomainAllowed(origin, allowedDomains)) {
        return createForbiddenResponse("Forbidden: Invalid Origin");
      }
    }

    // 3. 檢查 Referer header
    if (referer) {
      if (!isDomainAllowed(referer, allowedDomains)) {
        return createForbiddenResponse("Forbidden: Invalid Referer");
      }
    }

    // 4. 如果沒有 Origin 且沒有 Referer，且不是同源請求，則拒絕
    // 這可以阻擋大部分的 curl/wget 等工具的直接調用
    if (!origin && !referer && secFetchSite !== "same-origin") {
      // 允許來自同一 host 的請求（Server-side 調用）
      const requestHost = host?.split(":")[0];
      const isLocalhost =
        requestHost === "localhost" || requestHost === "127.0.0.1";

      // 開發環境下允許 localhost
      if (process.env.NODE_ENV === "development" && isLocalhost) {
        return NextResponse.next();
      }

      return createForbiddenResponse(
        "Forbidden: Direct API access is not allowed",
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/optimize/:path*",
};
