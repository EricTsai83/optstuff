import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ipx } from "@/lib/ipx-client";
import {
  ensureUint8Array,
  ensureProtocol,
  resolveContentType,
  parseIpxPath,
  parseOperationsString,
  isLocalFilePath,
  stripSelfDomain,
} from "@/lib/ipx-utils";

/**
 * Image Optimization API Route Handler
 *
 * Uses IPX native URL format:
 * /api/optimize/{operations}/{image_path}
 *
 * Supports both local files (from public directory) and remote URLs.
 *
 * @example Local files (from public directory)
 * /api/optimize/w_200/demo-image.png
 * /api/optimize/f_webp,q_80/images/photo.jpg
 *
 * @example Remote URLs
 * /api/optimize/w_200/example.com/image.jpg
 * /api/optimize/f_webp/cdn.site.com/image.jpg
 * /api/optimize/embed,f_webp,s_200x200/example.com/image.jpg
 * /api/optimize/_/example.com/image.jpg
 */

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const resolvedParams = await params;
  let imagePath: string | undefined;
  let finalImagePath: string | undefined;

  try {
    const parsed = parseIpxPath(resolvedParams.path);

    if (!parsed) {
      return NextResponse.json(
        {
          error: "Invalid path format",
          usage: "/api/optimize/{operations}/{image_url}",
          examples: [
            "/api/optimize/w_200/example.com/image.jpg",
            "/api/optimize/f_webp,q_80/example.com/image.jpg",
            "/api/optimize/_/example.com/image.jpg",
          ],
        },
        { status: 400 },
      );
    }

    imagePath = parsed.imagePath;
    const operations = parseOperationsString(parsed.operations);

    // Strip self-referencing domain (e.g., optstuff.vercel.app/demo.png -> demo.png)
    const normalizedPath = stripSelfDomain(imagePath);

    // Local files use "/" prefix for IPX file storage, remote URLs need protocol
    finalImagePath = isLocalFilePath(normalizedPath)
      ? `/${normalizedPath}`
      : ensureProtocol(normalizedPath);

    const processedImage = await ipx(finalImagePath, operations).process();
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
    console.error("Image path:", imagePath);
    if (imagePath && finalImagePath !== imagePath) {
      console.error("Resolved image path:", finalImagePath);
    }

    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        error: "Image processing failed",
        details: errorMessage,
        imagePath,
        resolvedPath:
          imagePath && finalImagePath !== imagePath
            ? finalImagePath
            : undefined,
      },
      { status: 500 },
    );
  }
}
