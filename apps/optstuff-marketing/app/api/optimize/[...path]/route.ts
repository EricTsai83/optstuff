import { NextResponse } from "next/server";

import { ipx } from "@/lib/ipx-client";
import {
  ensureUint8Array,
  resolveContentType,
  parseIpxPath,
  parseOperationsString,
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

export const dynamic = "force-dynamic";

export async function GET(
  _: unknown,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
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
