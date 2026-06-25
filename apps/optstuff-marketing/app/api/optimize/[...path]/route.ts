import { NextResponse } from "next/server";

import { ipx } from "@/lib/ipx-client";
import {
  ensureUint8Array,
  parseIpxPath,
  parseOperationsString,
  resolveContentType,
} from "@/lib/ipx-utils";

const DEMO_ASSETS = new Set(["demo-image.png", "demo-image.webp"]);
const VALID_OPERATION_KEYS = new Set(["w", "h", "q", "f", "fit", "s"]);
const VALID_FORMATS = new Set(["webp", "avif", "png", "jpg", "jpeg"]);
const VALID_FITS = new Set(["cover", "contain", "fill"]);
const MAX_DIMENSION = 1200;
const DEMO_RATE_LIMIT_WINDOW_MS = 60_000;
const DEMO_RATE_LIMIT_MAX_REQUESTS = 120;

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const rateLimitBuckets = new Map<string, RateLimitBucket>();

function getClientRateLimitId(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const firstForwardedFor = forwardedFor?.split(",")[0]?.trim();
  const candidates = [
    firstForwardedFor,
    request.headers.get("x-real-ip"),
    request.headers.get("cf-connecting-ip"),
  ];
  return (
    candidates.find((candidate) => candidate && candidate.length > 0) ??
    "unknown"
  );
}

function checkDemoRateLimit(
  identifier: string,
): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  const now = Date.now();
  const current = rateLimitBuckets.get(identifier);

  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(identifier, {
      count: 1,
      resetAt: now + DEMO_RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true };
  }

  if (current.count >= DEMO_RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { allowed: true };
}

function parseBoundedInt(
  value: string | boolean,
  name: string,
  min: number,
  max: number,
): string | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return `${name} must be an integer between ${min} and ${max}`;
  }

  const parsed = Number(value);
  if (
    !Number.isInteger(parsed) ||
    !Number.isFinite(parsed) ||
    parsed < min ||
    parsed > max
  ) {
    return `${name} must be an integer between ${min} and ${max}`;
  }

  return null;
}

function validateDemoOperations(
  operations: Record<string, string | boolean>,
): string | null {
  for (const key of Object.keys(operations)) {
    if (!VALID_OPERATION_KEYS.has(key)) {
      return `Unsupported operation: ${key}`;
    }
  }

  if ("w" in operations) {
    const error = parseBoundedInt(operations.w, "w", 1, MAX_DIMENSION);
    if (error) return error;
  }

  if ("h" in operations) {
    const error = parseBoundedInt(operations.h, "h", 1, MAX_DIMENSION);
    if (error) return error;
  }

  if ("q" in operations) {
    const error = parseBoundedInt(operations.q, "q", 1, 100);
    if (error) return error;
  }

  if ("f" in operations) {
    const format = operations.f;
    if (typeof format !== "string" || !VALID_FORMATS.has(format)) {
      return "Unsupported image format";
    }
  }

  if ("fit" in operations) {
    const fit = operations.fit;
    if (typeof fit !== "string" || !VALID_FITS.has(fit)) {
      return "Unsupported fit mode";
    }
  }

  if ("s" in operations) {
    const size = operations.s;
    if (typeof size !== "string") return "Invalid size operation";

    const match = /^(\d+)x(\d+)$/.exec(size);
    const width = match?.[1];
    const height = match?.[2];
    if (!width || !height) return "Invalid size operation";

    const widthError = parseBoundedInt(width, "width", 1, MAX_DIMENSION);
    if (widthError) return widthError;
    const heightError = parseBoundedInt(height, "height", 1, MAX_DIMENSION);
    if (heightError) return heightError;
  }

  return null;
}

/**
 * Image Optimization API Route Handler
 *
 * Uses IPX native URL format:
 * /api/optimize/{operations}/{image_path}
 *
 * Only supports local files from the public directory.
 * Remote URLs are rejected for security reasons.
 *
 * @example Local files (from public directory)
 * /api/optimize/w_200/demo-image.png
 * /api/optimize/f_webp,q_80/images/photo.jpg
 */

/**
 * Checks whether the request originates from the same host by comparing the
 * `Referer` or `Origin` header against the request's `Host` header.
 *
 * This prevents external crawlers and scanners from hitting the endpoint
 * directly while allowing legitimate same-origin requests from the marketing
 * page (which shares a domain with the dashboard via microfrontends).
 *
 * Always returns `true` in development so local testing is unaffected.
 *
 * @param request - The incoming HTTP request.
 * @returns `true` if the request comes from the same host, `false` otherwise.
 */
function isSameOrigin(request: Request): boolean {
  if (process.env.NODE_ENV === "development") return true;

  const requestHost = request.headers.get("host");
  if (!requestHost) return false;

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).host === requestHost;
    } catch {
      return false;
    }
  }

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host === requestHost;
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Handles GET requests to serve IPX-optimized images for the marketing demo.
 *
 * Rejects cross-origin requests via {@link isSameOrigin}, then parses the
 * IPX path, applies the requested operations, and returns the processed image
 * with immutable cache headers so repeated requests are served from the CDN edge.
 *
 * @param _request - The incoming HTTP request (used for origin validation).
 * @param params - Route parameters containing the IPX operations and image path segments.
 * @returns The optimized image on success, or a JSON error response on failure.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const rateLimit = checkDemoRateLimit(getClientRateLimitId(_request));
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  if (!isSameOrigin(_request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const resolvedParams = await params;
    const parsed = parseIpxPath(resolvedParams.path);

    if (!parsed) {
      return NextResponse.json(
        {
          error: "Invalid path format",
          usage: "/api/optimize/{operations}/{image_path}",
          examples: [
            "/api/optimize/w_200/demo-image.png",
            "/api/optimize/f_webp,q_80/images/photo.jpg",
            "/api/optimize/_/logo.svg",
          ],
        },
        { status: 400 },
      );
    }

    const operations = parseOperationsString(parsed.operations);
    const operationError = validateDemoOperations(operations);
    if (operationError) {
      return NextResponse.json({ error: operationError }, { status: 400 });
    }

    if (!DEMO_ASSETS.has(parsed.imagePath)) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Local files use "/" prefix for IPX file storage
    const imagePath = `/${parsed.imagePath}`;

    const processedImage = await ipx(imagePath, operations).process();
    const imageData = ensureUint8Array(processedImage.data);
    const contentType = resolveContentType(processedImage.format ?? "webp");

    return new Response(imageData as Uint8Array<ArrayBuffer>, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Image processing error:", error);

    return NextResponse.json(
      { error: "Image processing failed" },
      { status: 500 },
    );
  }
}
