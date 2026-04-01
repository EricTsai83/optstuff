import { NextResponse } from "next/server";

import { ipx } from "@/lib/ipx-client";
import {
  ensureUint8Array,
  parseIpxPath,
  parseOperationsString,
  resolveContentType,
} from "@/lib/ipx-utils";

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

    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        error: "Image processing failed",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
