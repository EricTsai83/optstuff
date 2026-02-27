import crypto from "crypto";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.includes("xxx") || value.includes("your-")) {
    throw new Error(
      `Missing or invalid environment variable: ${name}. Set it in examples/nextjs/.env.local`,
    );
  }
  return value;
}

const OPTSTUFF_BASE_URL = requireEnv("OPTSTUFF_BASE_URL");
const OPTSTUFF_PROJECT_SLUG = requireEnv("OPTSTUFF_PROJECT_SLUG");
const OPTSTUFF_PUBLIC_KEY = requireEnv("OPTSTUFF_PUBLIC_KEY");
const OPTSTUFF_SECRET_KEY = requireEnv("OPTSTUFF_SECRET_KEY");
const EXPIRY_BUCKET_SECONDS = 3600;
const BLUR_DATA_REVALIDATE_SECONDS = 3600;
const BLUR_DATA_FETCH_TIMEOUT_MS = 1500;

export type ImageOperation = {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "avif" | "png" | "jpg";
  fit?: "cover" | "contain" | "fill";
};

function computeBucketedExpiration(expiresInSeconds: number): number {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const ttlSeconds = Math.max(1, Math.floor(expiresInSeconds));
  const bucketSeconds = Math.min(EXPIRY_BUCKET_SECONDS, ttlSeconds);
  const rawExpiration = nowSeconds + ttlSeconds;
  const bucketedExpiration =
    bucketSeconds > 0 && bucketSeconds < ttlSeconds
      ? Math.floor(rawExpiration / bucketSeconds) * bucketSeconds
      : rawExpiration;
  return Math.max(nowSeconds + 1, bucketedExpiration);
}

function buildOperationString(ops: ImageOperation): string {
  const parts: string[] = [];

  if (ops.width) parts.push(`w_${ops.width}`);
  if (ops.height) parts.push(`h_${ops.height}`);
  if (ops.quality) parts.push(`q_${ops.quality}`);
  if (ops.format) parts.push(`f_${ops.format}`);
  if (ops.fit) parts.push(`fit_${ops.fit}`);

  return parts.length > 0 ? parts.join(",") : "_";
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
    exp = computeBucketedExpiration(expiresInSeconds);
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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BLUR_DATA_FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      cache: "force-cache",
      next: { revalidate: BLUR_DATA_REVALIDATE_SECONDS },
      signal: controller.signal,
    });
    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers.get("content-type") ?? `image/${format}`;
      return `data:${contentType};base64,${buffer.toString("base64")}`;
    }
  } catch {
    // fetch failed — fall through to direct URL
  } finally {
    clearTimeout(timeoutId);
  }

  return url;
}
