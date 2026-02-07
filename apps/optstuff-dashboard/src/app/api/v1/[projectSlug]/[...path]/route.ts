import { NextResponse } from "next/server";

import {
  ensureProtocol,
  ensureUint8Array,
  parseIpxPath,
  parseOperationsString,
  resolveContentType,
} from "@/lib/ipx-utils";
import { verifyUrlSignature } from "@/server/lib/api-key";
import { getProjectIPX } from "@/server/lib/ipx-factory";
import { getApiKeyConfig, getProjectConfig } from "@/server/lib/config-cache";
import { checkRateLimit } from "@/server/lib/rate-limiter";
import { logRequest } from "@/server/lib/request-logger";
import { updateApiKeyLastUsed } from "@/server/lib/usage-tracker";
import {
  parseSignatureParams,
  validateReferer,
  validateSourceDomain,
} from "@/server/lib/validators";

/**
 * IPX Image Optimization API Route Handler
 *
 * URL Format: /api/v1/{projectSlug}/{operations}/{imageUrl}?key={keyPrefix}&sig={signature}&exp={expiry}
 *
 * Security:
 * - All requests require a valid signature created with the API key's secret
 * - Source domains are validated against the API key's allowlist
 * - Referer domains are validated against the project's allowlist
 *
 * @example
 * /api/v1/my-blog/w_800,f_webp/images.example.com/photo.jpg?key=pk_abc123&sig=xyz789
 * /api/v1/my-blog/_/cdn.mysite.com/banner.png?key=pk_abc123&sig=xyz789&exp=1706500000
 */

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectSlug: string; path: string[] }> },
) {
  const startTime = Date.now();
  const resolvedParams = await params;
  const { projectSlug, path } = resolvedParams;
  const url = new URL(request.url);

  try {
    // 1. Get project configuration (with caching)
    const project = await getProjectConfig(projectSlug);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // 2. Parse and validate signature parameters
    const sigParams = parseSignatureParams(url.searchParams);
    if (!sigParams) {
      return NextResponse.json(
        {
          error: "Missing signature parameters",
          usage:
            "/api/v1/{projectSlug}/{operations}/{imageUrl}?key={keyPrefix}&sig={signature}",
        },
        { status: 401 },
      );
    }

    // 3. Get API key configuration
    const apiKey = await getApiKeyConfig(sigParams.keyPrefix);
    if (!apiKey) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    // Verify API key belongs to this project
    if (apiKey.projectId !== project.id) {
      return NextResponse.json(
        { error: "API key does not belong to this project" },
        { status: 401 },
      );
    }

    // Check if API key is revoked (defense in depth — cache may be stale)
    if (apiKey.revokedAt) {
      return NextResponse.json(
        { error: "API key has been revoked" },
        { status: 401 },
      );
    }

    // Check if API key is expired
    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      return NextResponse.json(
        { error: "API key has expired" },
        { status: 401 },
      );
    }

    // 4. Check rate limit
    const rateLimitResult = await checkRateLimit({
      keyPrefix: apiKey.keyPrefix,
      limitPerMinute: apiKey.rateLimitPerMinute,
      limitPerDay: apiKey.rateLimitPerDay,
    });

    if (!rateLimitResult.allowed) {
      await logRequest(project.id, {
        sourceUrl: path.join("/"),
        status: "forbidden",
      });
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          reason:
            rateLimitResult.reason === "minute"
              ? "Too many requests per minute"
              : "Daily limit exceeded",
          retryAfter: rateLimitResult.retryAfterSeconds,
          limit: rateLimitResult.limit,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimitResult.retryAfterSeconds),
            "X-RateLimit-Limit": String(rateLimitResult.limit),
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
          },
        },
      );
    }

    // 5. Parse path first to get the signing payload
    const parsed = parseIpxPath(path);
    if (!parsed) {
      return NextResponse.json(
        {
          error: "Invalid path format",
          usage:
            "/api/v1/{projectSlug}/{operations}/{imageUrl}?key={keyPrefix}&sig={signature}",
          examples: [
            "/api/v1/my-blog/w_800,f_webp/images.example.com/photo.jpg?key=pk_abc&sig=xyz",
          ],
        },
        { status: 400 },
      );
    }

    // 6. Verify signature
    const signaturePath = `${parsed.operations}/${parsed.imagePath}`;
    if (
      !verifyUrlSignature(
        apiKey.secretKey,
        signaturePath,
        sigParams.signature,
        sigParams.expiresAt,
      )
    ) {
      await logRequest(project.id, {
        sourceUrl: path.join("/"),
        status: "forbidden",
      });
      return NextResponse.json(
        { error: "Invalid or expired signature" },
        { status: 403 },
      );
    }

    // 7. Validate Referer (project-level)
    const referer = request.headers.get("referer");
    if (!validateReferer(referer, project.allowedRefererDomains)) {
      await logRequest(project.id, {
        sourceUrl: path.join("/"),
        status: "forbidden",
      });
      return NextResponse.json(
        { error: "Forbidden: Invalid referer" },
        { status: 403 },
      );
    }

    // 8. Build full image URL and validate source domain (API key-level)
    let imageUrl: string;
    try {
      imageUrl = ensureProtocol(parsed.imagePath);
    } catch (error) {
      return NextResponse.json(
        {
          error: "Invalid image URL",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 400 },
      );
    }

    let sourceHost: string;
    try {
      sourceHost = new URL(imageUrl).hostname;
    } catch {
      return NextResponse.json(
        {
          error: "Invalid image URL",
          details: `Unable to parse URL: ${imageUrl}`,
        },
        { status: 400 },
      );
    }

    if (!validateSourceDomain(sourceHost, apiKey.allowedSourceDomains)) {
      await logRequest(project.id, {
        sourceUrl: imageUrl,
        status: "forbidden",
      });
      return NextResponse.json(
        { error: "Forbidden: Source domain not allowed" },
        { status: 403 },
      );
    }

    // 9. Process image with IPX
    const ipx = getProjectIPX(apiKey.allowedSourceDomains);
    const operations = parseOperationsString(parsed.operations);
    const processedImage = await ipx(imageUrl, operations).process();

    const imageData = ensureUint8Array(processedImage.data);
    const contentType = resolveContentType(processedImage.format ?? "webp");
    const processingTimeMs = Date.now() - startTime;

    // 10. Update API key last used timestamp (fire-and-forget, batched)
    updateApiKeyLastUsed(apiKey.id, project.id);

    // 11. Log successful request (fire-and-forget)
    // HEAD fetch for originalSize is moved here so it never blocks the response.
    void (async () => {
      let originalSize: number | undefined;
      try {
        const headResponse = await fetch(imageUrl, {
          method: "HEAD",
          signal: AbortSignal.timeout(3_000),
        });
        const contentLength = headResponse.headers.get("content-length");
        if (contentLength) {
          originalSize = parseInt(contentLength, 10);
        }
      } catch {
        // Ignore — originalSize is optional for logging
      }

      await logRequest(project.id, {
        sourceUrl: imageUrl,
        status: "success",
        processingTimeMs,
        originalSize,
        optimizedSize: imageData.length,
      }).catch(() => {
        // Ignore logging errors
      });
    })();

    // 12. Return optimized image
    return new Response(imageData as Uint8Array<ArrayBuffer>, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Processing-Time": `${processingTimeMs}ms`,
      },
    });
  } catch (error) {
    console.error("Image processing error:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    // Log error (fire-and-forget)
    try {
      const project = await getProjectConfig(projectSlug);
      if (project) {
        logRequest(project.id, {
          sourceUrl: path.join("/"),
          status: "error",
        }).catch(() => {});
      }
    } catch {
      // Ignore
    }

    return NextResponse.json(
      {
        error: "Image processing failed",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
