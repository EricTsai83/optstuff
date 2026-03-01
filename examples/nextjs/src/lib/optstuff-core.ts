import "server-only";
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

const OPTSTUFF_BASE_URL = requireEnv("OPTSTUFF_BASE_URL").replace(/\/+$/, "");
const OPTSTUFF_PROJECT_SLUG = requireEnv("OPTSTUFF_PROJECT_SLUG");
const OPTSTUFF_PUBLIC_KEY = requireEnv("OPTSTUFF_PUBLIC_KEY");
const OPTSTUFF_SECRET_KEY = requireEnv("OPTSTUFF_SECRET_KEY");
const EXPIRY_BUCKET_SECONDS = 3600;
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

function buildOperationString(ops: ImageOperation): string {
  const parts: string[] = [];

  if (ops.width !== undefined) {
    if (
      typeof ops.width !== "number" ||
      !Number.isFinite(ops.width) ||
      ops.width < 0
    ) {
      throw new Error(
        "Invalid image operation: width must be a finite number >= 0",
      );
    }
    parts.push(`w_${ops.width}`);
  }

  if (ops.height !== undefined) {
    if (
      typeof ops.height !== "number" ||
      !Number.isFinite(ops.height) ||
      ops.height < 0
    ) {
      throw new Error(
        "Invalid image operation: height must be a finite number >= 0",
      );
    }
    parts.push(`h_${ops.height}`);
  }

  if (ops.quality !== undefined) {
    if (
      typeof ops.quality !== "number" ||
      !Number.isFinite(ops.quality) ||
      ops.quality < 1 ||
      ops.quality > 100
    ) {
      throw new Error(
        "Invalid image operation: quality must be a finite number between 1 and 100",
      );
    }
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
      throw new Error("Invalid image operation: fit must be a non-empty string");
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

export function generateOptStuffUrl(
  imageUrl: string,
  operations: ImageOperation,
  expiresInSeconds?: number,
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

  const normalizedPathname = parsedImageUrl.pathname.replace(/\/+$/, "");
  const normalizedSearch = parsedImageUrl.search.startsWith("?")
    ? parsedImageUrl.search.slice(1)
    : parsedImageUrl.search;
  const encodedSearch = normalizedSearch
    ? `%3F${encodeURIComponent(normalizedSearch)}`
    : "";
  const normalizedImageUrl = `${parsedImageUrl.hostname}${parsedImageUrl.port ? `:${parsedImageUrl.port}` : ""}${normalizedPathname}${encodedSearch}`;

  const signingPath = `${opString}/${normalizedImageUrl}`;
  const urlPath = `/api/v1/${OPTSTUFF_PROJECT_SLUG}/${signingPath}`;

  const params = new URLSearchParams();
  params.set("key", OPTSTUFF_PUBLIC_KEY);

  let exp: number | undefined;
  if (
    expiresInSeconds !== undefined &&
    Number.isFinite(expiresInSeconds) &&
    expiresInSeconds > 0
  ) {
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
