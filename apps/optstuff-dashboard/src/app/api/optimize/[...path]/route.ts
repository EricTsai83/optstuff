import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ipx } from "@/lib/ipx-client";

/**
 * 確保資料為 Uint8Array 格式
 */
function ensureUint8Array(data: unknown): Uint8Array {
  if (data instanceof Uint8Array) {
    return data;
  }
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }
  if (Buffer.isBuffer(data)) {
    return new Uint8Array(data);
  }
  throw new Error("Unsupported data type for image processing");
}

/**
 * 恢復 URL 中被折疊的協議雙斜線
 * (例如: "https:/example.com" -> "https://example.com")
 * 處理多種情況：
 * - "http:/localhost" -> "http://localhost"
 * - "https:/example.com" -> "https://example.com"
 * - "http://localhost" -> "http://localhost" (不變)
 */
function restoreProtocolSlashes(path: string): string {
  // 匹配 http:/ 或 https:/ 後面跟著非斜線字符的情況
  return path.replace(/^(https?:\/)(?!\/)/, "$1/");
}

/**
 * 自動補全協議和路徑
 * - 如果路徑以 https:// 或 http:// 開頭，拋出錯誤
 * - 如果路徑以 / 開頭，拋出錯誤
 * - localhost 開頭：添加 http://
 * - 其他域名開頭：添加 https://
 * - 假設所有路徑都來自遠程
 *
 * @example
 * - "localhost:3024/demo-image.png" -> "http://localhost:3024/demo-image.png"
 * - "example.com/image.jpg" -> "https://example.com/image.jpg"
 * @throws {Error} 如果路徑以 https://、http:// 或 / 開頭
 */
function ensureProtocol(path: string): string {
  // 如果路徑以 https:// 或 http:// 開頭，拋出錯誤
  if (path.startsWith("https://") || path.startsWith("http://")) {
    throw new Error(
      "路徑不能以 https:// 或 http:// 開頭，請提供不包含協議的路徑",
    );
  }

  // 如果路徑以 / 開頭，拋出錯誤
  if (path.startsWith("/")) {
    throw new Error("路徑不能以 / 開頭，請提供完整的域名路徑");
  }

  // 如果路徑包含其他協議的 ://，不處理
  if (path.includes("://")) {
    return path;
  }

  // 如果以 localhost 開頭，添加 http://
  if (path.startsWith("localhost")) {
    return `http://${path}`;
  }

  // 其他情況，統一添加 https://
  return `https://${path}`;
}

/**
 * 根據圖片格式解析 Content-Type
 */
function resolveContentType(format: string): string {
  return format === "jpeg" ? "image/jpeg" : `image/${format}`;
}

/**
 * 解析 IPX 路徑格式
 *
 * 格式: /api/optimize/{operations}/{image_path}
 *
 * @example
 * - /api/optimize/w_200/https://example.com/image.jpg
 *   => { operations: "w_200", imagePath: "https://example.com/image.jpg" }
 *
 * - /api/optimize/embed,f_webp,s_200x200/https://example.com/image.jpg
 *   => { operations: "embed,f_webp,s_200x200", imagePath: "https://example.com/image.jpg" }
 *
 * - /api/optimize/_/https://example.com/image.jpg
 *   => { operations: "_", imagePath: "https://example.com/image.jpg" }
 */
function parseIpxPath(pathSegments: string[]): {
  readonly operations: string;
  readonly imagePath: string;
} | null {
  if (pathSegments.length < 2) {
    return null;
  }

  // 第一段是操作參數
  const operations = pathSegments[0]!;

  // 剩餘部分組合成圖片路徑
  let imagePath = pathSegments.slice(1).join("/");

  // 解碼 URL 編碼字符
  imagePath = decodeURIComponent(imagePath);

  // 恢復協議中的雙斜線
  imagePath = restoreProtocolSlashes(imagePath);

  return { operations, imagePath };
}

/**
 * 將 IPX URL 格式的操作字串轉換為操作物件
 *
 * @example
 * - "w_200" => { width: "200" }
 * - "embed,f_webp,s_200x200" => { fit: "embed", format: "webp", resize: "200x200" }
 * - "_" => {}
 */
function parseOperationsString(
  operationsStr: string,
): Record<string, string | boolean> {
  // "_" 表示無操作
  if (operationsStr === "_") {
    return {};
  }

  const operations: Record<string, string | boolean> = {};
  const parts = operationsStr.split(",");

  for (const part of parts) {
    // 處理有值的操作 (如 w_200, f_webp)
    const underscoreIndex = part.indexOf("_");

    if (underscoreIndex > 0) {
      const key = part.slice(0, underscoreIndex);
      const value = part.slice(underscoreIndex + 1);
      // IPX 內部期望字符串格式的參數
      operations[key] = value;
    } else {
      // 處理無值的操作 (如 flip, flop, grayscale, embed)
      operations[part] = true;
    }
  }

  return operations;
}

/**
 * 圖片優化 API Route Handler
 *
 * 使用 IPX 原生 URL 格式：
 * /api/optimize/{operations}/{image_path}
 *
 * 圖片路徑支持多種格式（會自動統一處理協議）：
 * - localhost 格式（統一為 http://）：localhost:3024/demo-image.png
 * - 其他域名（統一為 https://）：example.com/image.jpg
 *
 * 注意：
 * - 路徑不能以 http:// 或 https:// 開頭，否則會報錯
 * - 路徑不能以 / 開頭，否則會報錯
 * - localhost 開頭 → 統一為 http://localhost:...
 * - 其他域名 → 統一為 https://...
 *
 * @example
 * // localhost 格式（統一為 http://localhost:3024/demo-image.png）
 * /api/optimize/w_200/localhost:3024/demo-image.png
 *
 * // 其他域名（統一為 https://example.com/image.jpg）
 * /api/optimize/w_200/example.com/image.jpg
 *
 * // 轉換為 WebP 格式
 * /api/optimize/f_webp/example.com/image.jpg
 *
 * // 自動格式（根據瀏覽器支援）
 * /api/optimize/f_auto/example.com/image.jpg
 *
 * // 組合操作：embed fit、WebP 格式、200x200 尺寸
 * /api/optimize/embed,f_webp,s_200x200/example.com/image.jpg
 *
 * // 無操作，直接取得原圖
 * /api/optimize/_/example.com/image.jpg
 *
 * // 更多操作組合
 * /api/optimize/w_800,q_80,f_webp/example.com/image.jpg
 * /api/optimize/s_400x300,fit_cover/localhost:3024/demo-image.png
 * /api/optimize/blur_5,grayscale/example.com/image.jpg
 */

// 強制動態渲染，確保路由在生產環境正常工作
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
            "/api/optimize/w_200/localhost:3024/demo-image.png",
          ],
        },
        { status: 400 },
      );
    }

    imagePath = parsed.imagePath;
    const operations = parseOperationsString(parsed.operations);

    // 自動補全協議（假設所有路徑都來自遠程）
    // localhost 開頭 → http://，其他 → https://
    finalImagePath = ensureProtocol(imagePath);

    // 使用 IPX 處理圖片
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
