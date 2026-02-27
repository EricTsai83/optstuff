import { after, NextResponse } from "next/server";

import {
  ensureProtocol,
  ensureUint8Array,
  parseIpxPath,
  parseOperationsString,
  resolveContentType,
} from "@/lib/ipx-utils";
import { verifyUrlSignature } from "@/server/lib/api-key";
import {
  getApiKeyConfig,
  getProjectConfigById,
} from "@/server/lib/config-cache";
import { checkRateLimit } from "@/server/lib/rate-limiter";
import {
  parseSignatureParams,
  validateReferer,
  validateSourceDomain,
} from "@/server/lib/validators";

/**
 * IPX Image Optimization API Route Handler
 *
 * URL Format: /api/v1/{projectSlug}/{operations}/{imageUrl}?key={publicKey}&sig={signature}&exp={expiry}
 *
 * Security:
 * - All requests require a valid signature created with the API key's secret
 * - Source domains are validated against the project's allowlist
 * - Referer domains are validated against the project's allowlist
 *
 * @example
 * /api/v1/my-blog/w_800,f_webp/images.example.com/photo.jpg?key=pk_abc123&sig=xyz789
 * /api/v1/my-blog/_/cdn.mysite.com/banner.png?key=pk_abc123&sig=xyz789&exp=1706500000
 */

export const dynamic = "force-dynamic";

const PASSTHROUGH_STATUS_CODES = new Set([404, 410]);
const CACHE_CONTROL_HEADER =
  "public, s-maxage=31536000, max-age=31536000, immutable";
const ORIGINAL_SIZE_SAMPLE_RATE = 0.1;

function mapUpstreamErrorStatus(error: unknown): number {
  const raw =
    error instanceof Error && "statusCode" in error
      ? (error as { statusCode: number }).statusCode
      : undefined;

  if (typeof raw !== "number" || raw < 400 || raw > 599) return 500;
  if (PASSTHROUGH_STATUS_CODES.has(raw)) return raw;
  return 502;
}

type RouteParams = { projectSlug: string; path: string[] };
type RequestLogPayload = {
  sourceUrl: string;
  status: "success" | "error" | "forbidden" | "rate_limited";
  processingTimeMs?: number;
  originalSize?: number;
  optimizedSize?: number;
};
type ValidatedRequestContext = {
  readonly apiKey: NonNullable<Awaited<ReturnType<typeof getApiKeyConfig>>>;
  readonly project: NonNullable<Awaited<ReturnType<typeof getProjectConfigById>>>;
  readonly imageUrl: string;
  readonly parsed: NonNullable<ReturnType<typeof parseIpxPath>>;
  readonly path: string[];
};

const importIpxFactory = () => import("@/server/lib/ipx-factory");
const importRequestLogger = () => import("@/server/lib/request-logger");
const importUsageTracker = () => import("@/server/lib/usage-tracker");

let ipxFactoryModulePromise: ReturnType<typeof importIpxFactory> | undefined;
let requestLoggerModulePromise: ReturnType<typeof importRequestLogger> | undefined;
let usageTrackerModulePromise: ReturnType<typeof importUsageTracker> | undefined;

function getIpxFactoryModule() {
  ipxFactoryModulePromise ??= importIpxFactory();
  return ipxFactoryModulePromise;
}

function getRequestLoggerModule() {
  requestLoggerModulePromise ??= importRequestLogger();
  return requestLoggerModulePromise;
}

function getUsageTrackerModule() {
  usageTrackerModulePromise ??= importUsageTracker();
  return usageTrackerModulePromise;
}

async function getProjectIpxInstance() {
  const { getProjectIPX } = await getIpxFactoryModule();
  return getProjectIPX();
}

function logRequestInBackground(projectId: string, data: RequestLogPayload): void {
  void getRequestLoggerModule()
    .then(({ logRequest }) => logRequest(projectId, data))
    .catch(() => undefined);
}

async function logRequestAwait(projectId: string, data: RequestLogPayload) {
  const { logRequest } = await getRequestLoggerModule();
  await logRequest(projectId, data);
}

function updateUsageInBackground(apiKeyId: string, projectId: string): void {
  void getUsageTrackerModule()
    .then(({ updateApiKeyLastUsed }) => updateApiKeyLastUsed(apiKeyId, projectId))
    .catch(() => undefined);
}

function buildVaryHeader(
  allowedRefererDomains: readonly string[] | null | undefined,
): string {
  return allowedRefererDomains && allowedRefererDomains.length > 0
    ? "Accept, Referer"
    : "Accept";
}

function buildServerTimingHeader(
  authMs: number,
  transformMs: number,
  totalMs: number,
  probeMs?: number,
): string {
  const parts = [`auth;dur=${authMs}`];
  if (typeof probeMs === "number") {
    parts.push(`probe;dur=${probeMs}`);
  }
  parts.push(`transform;dur=${transformMs}`, `total;dur=${totalMs}`);
  return parts.join(", ");
}

function shouldSampleOriginalSize(): boolean {
  return Math.random() < ORIGINAL_SIZE_SAMPLE_RATE;
}

type UpstreamProbeResult =
  | { ok: true; probeTimeMs: number }
  | { ok: false; probeTimeMs: number; status: number };

function isNonTransformableContentType(contentType: string): boolean {
  const mimeType = contentType.split(";")[0]?.trim().toLowerCase();
  if (!mimeType) return false;
  if (mimeType.startsWith("image/")) return false;
  if (mimeType.startsWith("text/")) return true;

  return (
    mimeType === "application/json" ||
    mimeType === "application/xml" ||
    mimeType === "application/javascript"
  );
}

async function probeUpstreamSource(imageUrl: string): Promise<UpstreamProbeResult> {
  const probeStart = Date.now();
  try {
    const response = await fetch(imageUrl, {
      method: "HEAD",
      redirect: "error",
      signal: AbortSignal.timeout(3_000),
    });
    const probeTimeMs = Date.now() - probeStart;

    if (response.status >= 400) {
      return {
        ok: false,
        probeTimeMs,
        status: mapUpstreamErrorStatus({ statusCode: response.status }),
      };
    }

    const contentType = response.headers.get("content-type");
    if (contentType && isNonTransformableContentType(contentType)) {
      return { ok: false, probeTimeMs, status: 502 };
    }

    return { ok: true, probeTimeMs };
  } catch (error) {
    return {
      ok: false,
      probeTimeMs: Date.now() - probeStart,
      status: mapUpstreamErrorStatus(error),
    };
  }
}

async function validateRequest(
  request: Request,
  resolvedParams: RouteParams,
): Promise<
  | { ok: true; context: ValidatedRequestContext }
  | { ok: false; response: Response }
> {
  const { projectSlug, path } = resolvedParams;
  const url = new URL(request.url);
  const sourcePath = path.join("/");

  // 1. Parse and validate signature parameters
  const sigParams = parseSignatureParams(url.searchParams);
  if (!sigParams) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Missing signature parameters",
          usage:
            "/api/v1/{projectSlug}/{operations}/{imageUrl}?key={publicKey}&sig={signature}",
        },
        { status: 401 },
      ),
    };
  }

  // 2. Get API key configuration
  const apiKey = await getApiKeyConfig(sigParams.publicKey);
  if (!apiKey) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid API key" }, { status: 401 }),
    };
  }

  // Check if API key is revoked (defense in depth — cache may be stale)
  if (apiKey.revokedAt) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "API key has been revoked" },
        { status: 401 },
      ),
    };
  }

  // Check if API key is expired
  if (apiKey.expiresAt && Date.now() > apiKey.expiresAt.getTime()) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "API key has expired" },
        { status: 401 },
      ),
    };
  }

  // 3. Parse path to get the signing payload
  const parsed = parseIpxPath(path);
  if (!parsed) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Invalid path format",
          usage:
            "/api/v1/{projectSlug}/{operations}/{imageUrl}?key={publicKey}&sig={signature}",
          examples: [
            "/api/v1/my-blog/w_800,f_webp/images.example.com/photo.jpg?key=pk_abc&sig=xyz",
          ],
        },
        { status: 400 },
      ),
    };
  }

  // 4. Verify signature before project lookup and rate limiting:
  //    - rejects invalid traffic as early as possible
  //    - avoids unnecessary cache/DB work for bad signatures
  //    - prevents quota exhaustion by unauthenticated requests
  const signaturePath = `${parsed.operations}/${parsed.imagePath}`;
  if (
    !verifyUrlSignature(
      apiKey.secretKey,
      signaturePath,
      sigParams.signature,
      sigParams.expiresAt,
    )
  ) {
    logRequestInBackground(apiKey.projectId, {
      sourceUrl: sourcePath,
      status: "forbidden",
    });
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid or expired signature" },
        { status: 403 },
      ),
    };
  }

  // 5. Get project configuration by the API key's projectId (not by slug)
  //    This avoids slug collisions across teams — the project is always
  //    the one the API key was issued for.
  const project = await getProjectConfigById(apiKey.projectId);
  if (!project) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Project not found" }, { status: 404 }),
    };
  }

  // Verify the URL slug matches the project's actual slug to prevent
  // URL confusion (e.g. using team-A's slug with team-B's API key).
  if (project.slug !== projectSlug) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "API key does not belong to this project" },
        { status: 401 },
      ),
    };
  }

  // 6. Check rate limit (after signature verification so only
  //    authenticated requests consume quota)
  const rateLimitResult = await checkRateLimit({
    publicKey: apiKey.publicKey,
    limitPerMinute: apiKey.rateLimitPerMinute,
    limitPerDay: apiKey.rateLimitPerDay,
  });

  if (!rateLimitResult.allowed) {
    logRequestInBackground(project.id, {
      sourceUrl: sourcePath,
      status: "rate_limited",
    });
    return {
      ok: false,
      response: NextResponse.json(
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
      ),
    };
  }

  // 7. Validate Referer (project-level)
  const referer = request.headers.get("referer");
  if (!validateReferer(referer, project.allowedRefererDomains)) {
    logRequestInBackground(project.id, {
      sourceUrl: sourcePath,
      status: "forbidden",
    });
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Forbidden: Invalid referer" },
        { status: 403 },
      ),
    };
  }

  // 8. Build full image URL and validate source domain (project-level)
  let imageUrl: string;
  try {
    imageUrl = ensureProtocol(parsed.imagePath);
  } catch (error) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Invalid image URL",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 400 },
      ),
    };
  }

  let sourceHost: string;
  try {
    sourceHost = new URL(imageUrl).hostname;
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Invalid image URL",
          details: `Unable to parse URL: ${imageUrl}`,
        },
        { status: 400 },
      ),
    };
  }

  if (!validateSourceDomain(sourceHost, project.allowedSourceDomains)) {
    logRequestInBackground(project.id, {
      sourceUrl: imageUrl,
      status: "forbidden",
    });
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Forbidden: Source domain not allowed" },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true,
    context: {
      apiKey,
      project,
      imageUrl,
      parsed,
      path,
    },
  };
}

/**
 * Handle GET requests to serve IPX-optimized images for a project using signed URLs.
 *
 * Validates the request signature and API key, enforces rate limits and referer/source-domain restrictions, processes the requested image with IPX according to the signed operations, updates usage metadata, and logs the request. On success returns the optimized image bytes with appropriate caching and content-type headers; on failure returns a JSON error response with an appropriate HTTP status.
 *
 * @param request - The incoming Request object for the HTTP GET.
 * @param params - A promise resolving to route parameters: `projectSlug` (the project's URL slug) and `path` (an array representing the operations and image path segments).
 * @returns An HTTP response containing the optimized image on success, or a JSON error object with an appropriate status code on failure.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<RouteParams> },
) {
  const startTime = Date.now();
  const resolvedParams = await params;
  const validation = await validateRequest(request, resolvedParams);
  if (!validation.ok) {
    return validation.response;
  }
  const { project, imageUrl, apiKey, parsed } = validation.context;
  const authTimeMs = Date.now() - startTime;

  // 9. Process image with IPX
  const transformStartTime = Date.now();
  try {
    const ipx = await getProjectIpxInstance();
    const operations = parseOperationsString(parsed.operations);
    const processedImage = await ipx(imageUrl, operations).process();

    const imageData = ensureUint8Array(processedImage.data);
    const contentType = resolveContentType(processedImage.format ?? "webp");
    const transformTimeMs = Date.now() - transformStartTime;
    const processingTimeMs = Date.now() - startTime;
    const sampleOriginalSize = shouldSampleOriginalSize();

    // 10/11. Schedule usage tracking + logging after response is sent.
    // Sampling avoids sending an upstream HEAD for every successful request.
    after(async () => {
      updateUsageInBackground(apiKey.id, project.id);

      let originalSize: number | undefined;
      if (sampleOriginalSize) {
        try {
          const headResponse = await fetch(imageUrl, {
            method: "HEAD",
            redirect: "error",
            signal: AbortSignal.timeout(3_000),
          });
          const contentLength = headResponse.headers.get("content-length");
          if (contentLength) {
            originalSize = parseInt(contentLength, 10);
          }
        } catch {
          // Ignore — originalSize is optional for logging
        }
      }

      await logRequestAwait(project.id, {
        sourceUrl: imageUrl,
        status: "success",
        processingTimeMs,
        originalSize,
        optimizedSize: imageData.length,
      }).catch(() => {
        // Ignore logging errors
      });
    });

    const varyHeader = buildVaryHeader(project.allowedRefererDomains);

    // 12. Return optimized image
    return new Response(imageData as Uint8Array<ArrayBuffer>, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": CACHE_CONTROL_HEADER,
        Vary: varyHeader,
        "X-Processing-Time": `${processingTimeMs}ms`,
        "X-Original-Size-Sampled": sampleOriginalSize ? "1" : "0",
        "X-Head-Fast-Path": "0",
        "Server-Timing": buildServerTimingHeader(
          authTimeMs,
          transformTimeMs,
          processingTimeMs,
        ),
      },
    });
  } catch (error) {
    console.error("Image processing error:", error);

    logRequestInBackground(project.id, {
      sourceUrl: imageUrl,
      status: "error",
    });

    return NextResponse.json(
      { error: "Image processing failed" },
      { status: mapUpstreamErrorStatus(error) },
    );
  }
}

/**
 * Handle HEAD requests with a fast path that skips image transformation.
 *
 * The same authentication, authorization, and rate-limit checks as GET are
 * still applied. A successful response only returns headers so clients can
 * probe availability cheaply without triggering full IPX processing.
 */
export async function HEAD(
  request: Request,
  { params }: { params: Promise<RouteParams> },
) {
  const startTime = Date.now();
  const resolvedParams = await params;
  const validation = await validateRequest(request, resolvedParams);
  if (!validation.ok) {
    return validation.response;
  }
  const { project, imageUrl } = validation.context;
  const authTimeMs = Date.now() - startTime;
  const probeResult = await probeUpstreamSource(imageUrl);
  const processingTimeMs = Date.now() - startTime;
  const serverTiming = buildServerTimingHeader(
    authTimeMs,
    0,
    processingTimeMs,
    probeResult.probeTimeMs,
  );

  if (!probeResult.ok) {
    const errorHeaders = {
      Vary: buildVaryHeader(project.allowedRefererDomains),
      "X-Processing-Time": `${processingTimeMs}ms`,
      "X-Head-Fast-Path": "1",
      "Server-Timing": serverTiming,
    };

    if (request.method === "HEAD") {
      return new NextResponse(null, {
        status: probeResult.status,
        headers: errorHeaders,
      });
    }

    return NextResponse.json(
      { error: "Image processing failed" },
      {
        status: probeResult.status,
        headers: errorHeaders,
      },
    );
  }

  return new Response(null, {
    status: 200,
    headers: {
      "Cache-Control": CACHE_CONTROL_HEADER,
      Vary: buildVaryHeader(project.allowedRefererDomains),
      "X-Processing-Time": `${processingTimeMs}ms`,
      "X-Head-Fast-Path": "1",
      "Server-Timing": serverTiming,
    },
  });
}
