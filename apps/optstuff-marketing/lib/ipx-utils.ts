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

  // Only treat exact localhost (optionally with port or path) as HTTP
  if (
    path === "localhost" ||
    path.startsWith("localhost:") ||
    path.startsWith("localhost/")
  ) {
    return `http://${path}`;
  }

  return `https://${path}`;
}

/** Self-referencing domains that should be treated as local paths */
const SELF_DOMAINS = [
  "optstuff.vercel.app",
  "localhost",
  "localhost:3000",
  "localhost:3001",
  "127.0.0.1",
  "127.0.0.1:3000",
  "127.0.0.1:3001",
];

/**
 * Strip self-referencing domain prefix from path
 *
 * @example
 * - "optstuff.vercel.app/demo-image.png" -> "demo-image.png"
 * - "localhost:3000/images/photo.jpg" -> "images/photo.jpg"
 * - "example.com/image.jpg" -> "example.com/image.jpg" (unchanged)
 */
export function stripSelfDomain(path: string): string {
  for (const domain of SELF_DOMAINS) {
    if (path.startsWith(`${domain}/`)) {
      return path.slice(domain.length + 1);
    }
  }
  return path;
}

/**
 * Check if path is a local file (no domain/protocol)
 *
 * A local file path:
 * - Does not contain a domain (no dots before first slash, or no slash at all with extension)
 * - Examples: "demo-image.png", "images/photo.jpg"
 *
 * A remote URL path:
 * - Contains a domain
 * - Examples: "example.com/image.jpg", "cdn.site.com/photos/1.png"
 */
export function isLocalFilePath(path: string): boolean {
  // If path contains protocol markers, it's remote
  if (path.includes("://")) {
    return false;
  }

  const firstSlashIndex = path.indexOf("/");

  if (firstSlashIndex === -1) {
    // No slash - check if it looks like a domain (has dot but doesn't look like file extension)
    // "example.com" -> remote, "image.png" -> local
    const lastDotIndex = path.lastIndexOf(".");
    if (lastDotIndex === -1) {
      // No dot at all, treat as local
      return true;
    }
    // Check if the part after the last dot looks like a file extension (3-4 chars)
    const extension = path.slice(lastDotIndex + 1);
    const commonExtensions = [
      "png",
      "jpg",
      "jpeg",
      "gif",
      "webp",
      "avif",
      "svg",
      "ico",
    ];
    return commonExtensions.includes(extension.toLowerCase());
  }

  // Has slash - check if part before slash looks like a domain
  const firstPart = path.slice(0, firstSlashIndex);
  // If first part contains a dot, it's likely a domain
  return !firstPart.includes(".");
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
 * Parses IPX param strings by splitting on commas and extracting key-value pairs
 * at underscore positions. Keys are preserved as-is (abbreviated form).
 *
 * @example
 * - "w_200" => { w: "200" }
 * - "embed,f_webp,s_200x200" => { embed: true, f: "webp", s: "200x200" }
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
