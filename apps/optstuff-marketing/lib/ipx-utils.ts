/**
 * IPX image processing utility functions
 */

/**
 * Ensure data is in Uint8Array format
 */
export function ensureUint8Array(data: unknown): Uint8Array {
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
 * Restore collapsed double slashes in URL protocol
 *
 * @example
 * - "https:/example.com" -> "https://example.com"
 * - "http:/localhost" -> "http://localhost"
 */
export function restoreProtocolSlashes(path: string): string {
  return path.replace(/^(https?:\/)(?!\/)/, "$1/");
}

/**
 * Auto-complete protocol for URL path
 * - localhost: adds http://
 * - other domains: adds https://
 *
 * @throws {Error} if path starts with https://, http://, or /
 */
export function ensureProtocol(path: string): string {
  if (path.startsWith("https://") || path.startsWith("http://")) {
    throw new Error(
      "Path cannot start with https:// or http://, please provide path without protocol",
    );
  }

  if (path.startsWith("/")) {
    throw new Error(
      "Path cannot start with /, please provide full domain path",
    );
  }

  const protocolMatch = path.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):\/\//);
  if (protocolMatch) {
    const protocol = protocolMatch[1]!.toLowerCase();
    throw new Error(
      `Unsupported protocol: ${protocol}://. Only http:// or https:// are allowed`,
    );
  }

  if (path.startsWith("localhost")) {
    return `http://${path}`;
  }

  return `https://${path}`;
}

/**
 * Resolve Content-Type based on image format
 */
export function resolveContentType(format: string): string {
  return format === "jpg" || format === "jpeg"
    ? "image/jpeg"
    : `image/${format}`;
}

/**
 * Parse IPX path format
 *
 * Format: /{operations}/{image_path}
 *
 * @example
 * - ["w_200", "example.com/image.jpg"] => { operations: "w_200", imagePath: "example.com/image.jpg" }
 */
export function parseIpxPath(pathSegments: string[]): {
  readonly operations: string;
  readonly imagePath: string;
} | null {
  if (pathSegments.length < 2) {
    return null;
  }

  const operations = pathSegments[0]!;
  let imagePath = pathSegments.slice(1).join("/");

  imagePath = decodeURIComponent(imagePath);
  imagePath = restoreProtocolSlashes(imagePath);

  return { operations, imagePath };
}

/**
 * Convert IPX URL format operation string to operation object
 *
 * @example
 * - "w_200" => { width: "200" }
 * - "embed,f_webp,s_200x200" => { fit: "embed", format: "webp", resize: "200x200" }
 * - "_" => {}
 */
export function parseOperationsString(
  operationsStr: string,
): Record<string, string | boolean> {
  if (operationsStr === "_") {
    return {};
  }

  const operations: Record<string, string | boolean> = {};
  const parts = operationsStr.split(",");

  for (const part of parts) {
    const underscoreIndex = part.indexOf("_");

    if (underscoreIndex > 0) {
      const key = part.slice(0, underscoreIndex);
      const value = part.slice(underscoreIndex + 1);
      operations[key] = value;
    } else {
      operations[part] = true;
    }
  }

  return operations;
}
