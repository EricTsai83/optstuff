import crypto from "crypto";
import "server-only";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.includes("xxx") || value.includes("your-")) {
    throw new Error(
      `Missing or placeholder env var: ${name}. Set it in the environment or deployment configuration.`,
    );
  }
  return value;
}

const OPTSTUFF_BASE_URL = requireEnv("OPTSTUFF_BASE_URL").replace(/\/+$/, "");
const OPTSTUFF_PROJECT_SLUG = requireEnv("OPTSTUFF_PROJECT_SLUG");
const OPTSTUFF_PUBLIC_KEY = requireEnv("OPTSTUFF_PUBLIC_KEY");
const OPTSTUFF_SECRET_KEY = requireEnv("OPTSTUFF_SECRET_KEY");
const EXPIRY_BUCKET_SECONDS = 3600;
const MIN_DIMENSION = 1;
const MAX_DIMENSION = 8192;
const allowedFormats = ["webp", "avif", "png", "jpg"];
const allowedFits = ["cover", "contain", "fill"];

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

function assertIntegerInRange(
  value: number,
  name: string,
  min: number,
  max: number,
): void {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value < min ||
    value > max
  ) {
    throw new Error(
      `Invalid image operation: ${name} must be an integer between ${min} and ${max}`,
    );
  }
}

function buildOperationString(ops: ImageOperation): string {
  const parts: string[] = [];

  if (ops.width !== undefined) {
    assertIntegerInRange(ops.width, "width", MIN_DIMENSION, MAX_DIMENSION);
    parts.push(`w_${ops.width}`);
  }

  if (ops.height !== undefined) {
    assertIntegerInRange(ops.height, "height", MIN_DIMENSION, MAX_DIMENSION);
    parts.push(`h_${ops.height}`);
  }

  if (ops.quality !== undefined) {
    assertIntegerInRange(ops.quality, "quality", 1, 100);
    parts.push(`q_${ops.quality}`);
  }

  if (ops.format !== undefined) {
    if (typeof ops.format !== "string" || ops.format.trim() === "") {
      throw new Error(
        "Invalid image operation: format must be a non-empty string",
      );
    }

    const format = ops.format.trim();
    if (!allowedFormats.includes(format)) {
      throw new Error(
        `Invalid image operation: unsupported format "${format}". Allowed formats: ${allowedFormats.join(", ")}`,
      );
    }

    parts.push(`f_${format}`);
  }

  if (ops.fit !== undefined) {
    if (typeof ops.fit !== "string" || ops.fit.trim() === "") {
      throw new Error(
        "Invalid image operation: fit must be a non-empty string",
      );
    }

    const fit = ops.fit.trim();
    if (!allowedFits.includes(fit)) {
      throw new Error(
        `Invalid image operation: unsupported fit "${fit}". Allowed fits: ${allowedFits.join(", ")}`,
      );
    }

    parts.push(`fit_${fit}`);
  }

  return parts.length > 0 ? parts.join(",") : "_";
}

function buildCanonicalSourcePath(parsedImageUrl: URL): string {
  return `${parsedImageUrl.host}${parsedImageUrl.pathname}${parsedImageUrl.search}`;
}

function encodeImagePathForRoute(imagePath: string): string {
  return imagePath.split("/").map(encodeURIComponent).join("/");
}

/**
 * Generates a signed image optimization URL.
 *
 * @param imageUrl - Source image URL (e.g., "https://images.example.com/photo.jpg")
 * @param operations - Image operations to apply
 * @param expiresIn - Signature validity in seconds (optional)
 */
export function generateOptStuffUrl(
  imageUrl: string,
  operations: ImageOperation,
  expiresIn?: number,
): string {
  const opString = buildOperationString(operations);

  let parsedImageUrl: URL;
  try {
    parsedImageUrl = new URL(imageUrl);
  } catch {
    throw new Error("Invalid imageUrl: must be a valid absolute URL");
  }

  if (
    parsedImageUrl.protocol !== "http:" &&
    parsedImageUrl.protocol !== "https:"
  ) {
    throw new Error("Invalid imageUrl: protocol must be http or https");
  }

  const sourcePath = buildCanonicalSourcePath(parsedImageUrl);
  const signingPath = `${opString}/${sourcePath}`;
  const urlPath = `/api/v1/${OPTSTUFF_PROJECT_SLUG}/${opString}/${encodeImagePathForRoute(sourcePath)}`;

  const params = new URLSearchParams();
  params.set("key", OPTSTUFF_PUBLIC_KEY);

  let exp: number | undefined;
  if (expiresIn !== undefined) {
    if (
      typeof expiresIn !== "number" ||
      !Number.isFinite(expiresIn) ||
      expiresIn <= 0
    ) {
      throw new Error(
        "Invalid expiresIn: must be a finite number greater than 0",
      );
    }

    exp = computeBucketedExpiration(expiresIn);
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
