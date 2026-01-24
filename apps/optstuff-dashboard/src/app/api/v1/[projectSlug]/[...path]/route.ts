import { NextResponse } from "next/server";

import {
  ensureProtocol,
  ensureUint8Array,
  parseIpxPath,
  parseOperationsString,
  resolveContentType,
} from "@/lib/ipx-utils";
import { getProjectIPX } from "@/server/lib/ipx-factory";
import { getProjectConfig } from "@/server/lib/project-cache";
import { logRequest } from "@/server/lib/request-logger";
import { validateReferer, validateSourceDomain } from "@/server/lib/validators";

/**
 * IPX Image Optimization API Route Handler
 *
 * URL Format: /api/v1/{projectSlug}/{operations}/{imageUrl}
 *
 * @example
 * /api/v1/my-blog/w_800,f_webp/images.example.com/photo.jpg
 * /api/v1/my-blog/_/cdn.mysite.com/banner.png
 */

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectSlug: string; path: string[] }> },
): Promise<Response> {
  const startTime = Date.now();
  const resolvedParams = await params;
  const { projectSlug, path } = resolvedParams;

  try {
    // 1. Get project configuration (with caching)
    const project = await getProjectConfig(projectSlug);

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      );
    }

    // 2. Validate Referer
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

    // 3. Parse path
    const parsed = parseIpxPath(path);
    if (!parsed) {
      return NextResponse.json(
        {
          error: "Invalid path format",
          usage: "/api/v1/{projectSlug}/{operations}/{imageUrl}",
          examples: [
            "/api/v1/my-blog/w_800,f_webp/images.example.com/photo.jpg",
            "/api/v1/my-blog/_/cdn.mysite.com/banner.png",
          ],
        },
        { status: 400 },
      );
    }

    // 4. Build full image URL and validate source domain
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

    const sourceHost = new URL(imageUrl).hostname;
    if (!validateSourceDomain(sourceHost, project.allowedSourceDomains)) {
      await logRequest(project.id, {
        sourceUrl: imageUrl,
        status: "forbidden",
      });
      return NextResponse.json(
        { error: "Forbidden: Source domain not allowed" },
        { status: 403 },
      );
    }

    // 5. Process image with IPX
    const ipx = getProjectIPX(project.allowedSourceDomains);
    const operations = parseOperationsString(parsed.operations);
    const processedImage = await ipx(imageUrl, operations).process();

    const imageData = ensureUint8Array(processedImage.data);
    const contentType = resolveContentType(processedImage.format ?? "webp");
    const processingTimeMs = Date.now() - startTime;

    // 6. Log successful request (fire-and-forget)
    logRequest(project.id, {
      sourceUrl: imageUrl,
      status: "success",
      processingTimeMs,
      optimizedSize: imageData.length,
    }).catch(() => {
      // Ignore logging errors
    });

    // 7. Return optimized image
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

    const errorMessage =
      error instanceof Error ? error.message : String(error);

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
