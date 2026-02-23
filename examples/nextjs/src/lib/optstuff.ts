import crypto from "crypto";

const OPTSTUFF_BASE_URL =
  process.env.OPTSTUFF_BASE_URL ?? "https://your-optstuff-instance.com";
const OPTSTUFF_PROJECT_SLUG = process.env.OPTSTUFF_PROJECT_SLUG ?? "my-project";
const OPTSTUFF_PUBLIC_KEY = process.env.OPTSTUFF_PUBLIC_KEY ?? "pk_xxx";
const OPTSTUFF_SECRET_KEY = process.env.OPTSTUFF_SECRET_KEY ?? "sk_xxx";

export type ImageOperation = {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "avif" | "png" | "jpg";
  fit?: "cover" | "contain" | "fill";
};

/**
 * Serialise image operations into a URL path segment.
 * Returns `"_"` (the server-side no-op marker) when no operations are specified.
 */
function buildOperationString(ops: ImageOperation): string {
  const parts: string[] = [];

  if (ops.width) parts.push(`w_${ops.width}`);
  if (ops.height) parts.push(`h_${ops.height}`);
  if (ops.quality) parts.push(`q_${ops.quality}`);
  if (ops.format) parts.push(`f_${ops.format}`);
  if (ops.fit) parts.push(`fit_${ops.fit}`);

  return parts.length > 0 ? parts.join(",") : "_";
}

/**
 * Generate a signed OptStuff URL for image optimization.
 *
 * @example
 * ```ts
 * const url = generateOptStuffUrl("https://images.unsplash.com/photo.jpg", {
 *   width: 800,
 *   quality: 80,
 *   format: "webp",
 * });
 * // => https://your-optstuff-instance.com/api/v1/my-project/w_800,q_80,f_webp/images.unsplash.com/photo.jpg?key=pk_xxx&sig=abc123
 * ```
 */
/**
 * Return a blur placeholder for use in Server Components.
 *
 * Tries to fetch the tiny image from OptStuff and embed it as a base64 data
 * URL (zero client-side requests). If the fetch fails (e.g. service auth
 * rejects server-to-server calls), falls back to the direct signed URL which
 * still skips the `/api/optstuff` redirect hop.
 */
export async function getBlurDataUrl(
  imageUrl: string,
  {
    width = 32,
    quality = 20,
    format = "webp",
    fit = "cover",
  }: Partial<ImageOperation> = {},
): Promise<string> {
  const url = generateOptStuffUrl(imageUrl, { width, quality, format, fit }, 3600);

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers.get("content-type") ?? `image/${format}`;
      return `data:${contentType};base64,${buffer.toString("base64")}`;
    }
  } catch {
    // fetch failed — fall through to direct URL
  }

  return url;
}

export function generateOptStuffUrl(
  imageUrl: string,
  operations: ImageOperation,
  expiresInSeconds?: number,
): string {
  const opString = buildOperationString(operations);

  const normalizedImageUrl = imageUrl
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  const signingPath = `${opString}/${normalizedImageUrl}`;
  const urlPath = `/api/v1/${OPTSTUFF_PROJECT_SLUG}/${signingPath}`;

  const params = new URLSearchParams();
  params.set("key", OPTSTUFF_PUBLIC_KEY);

  let exp: number | undefined;
  if (expiresInSeconds !== undefined && expiresInSeconds > 0) {
    exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    params.set("exp", exp.toString());
  }

  const signPayload = exp ? `${signingPath}?exp=${exp}` : signingPath;
  const sig = crypto
    .createHmac("sha256", OPTSTUFF_SECRET_KEY)
    .update(signPayload)
    .digest("base64url")
    .substring(0, 32);

  params.set("sig", sig);

  return `${OPTSTUFF_BASE_URL}${urlPath}?${params.toString()}`;
}
