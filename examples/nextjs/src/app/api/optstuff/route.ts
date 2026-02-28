import { generateOptStuffUrl, type ImageOperation } from "@/lib/optstuff-core";
import { type NextRequest, NextResponse } from "next/server";

const VALID_FORMATS = new Set(["webp", "avif", "png", "jpg"] as const);
const VALID_FITS = new Set(["cover", "contain", "fill"] as const);

const SIGNED_URL_TTL_SECONDS = 3600;
const REDIRECT_CACHE_SECONDS = 300;
const REDIRECT_SWR_SECONDS = 3600;
const JSON_CACHE_SECONDS = 300;
const JSON_SWR_SECONDS = 3600;

const DEFAULT_ALLOWED_HOSTS = ["images.unsplash.com"];
const ALLOWED_HOSTS = new Set(
  (process.env.OPTSTUFF_ALLOWED_IMAGE_HOSTS ?? DEFAULT_ALLOWED_HOSTS.join(","))
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean),
);

type NumberParseOptions = {
  min?: number;
  max?: number;
};

type ValidatedPayload = {
  imageUrl: string;
  operations: ImageOperation;
};

function isAllowedHostname(hostname: string) {
  const normalized = hostname.toLowerCase();
  for (const allowedHost of ALLOWED_HOSTS) {
    if (normalized === allowedHost || normalized.endsWith(`.${allowedHost}`)) {
      return true;
    }
  }
  return false;
}

function parseImageUrl(value: unknown): { value: string } | { error: string } {
  if (typeof value !== "string" || value.trim() === "") {
    return { error: "imageUrl/url is required and must be a non-empty string" };
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(value);
  } catch {
    return { error: "imageUrl/url must be a valid URL" };
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    return { error: "imageUrl/url must use http or https" };
  }

  if (!isAllowedHostname(parsedUrl.hostname)) {
    return {
      error: `imageUrl/url hostname is not allowed. Configure OPTSTUFF_ALLOWED_IMAGE_HOSTS.`,
    };
  }

  return { value: parsedUrl.toString() };
}

function parseOptionalNumber(
  value: unknown,
  name: string,
  { min, max }: NumberParseOptions = {},
): { value: number | undefined } | { error: string } {
  if (value === undefined || value === null || value === "") return { value: undefined };
  const n = Number(value);
  if (Number.isNaN(n) || !Number.isFinite(n)) {
    return { error: `${name} must be a valid number` };
  }

  const rounded = Math.round(n);
  if (min !== undefined && rounded < min) {
    return { error: `${name} must be >= ${min}` };
  }
  if (max !== undefined && rounded > max) {
    return { error: `${name} must be <= ${max}` };
  }
  return { value: rounded };
}

function validatePayload(payload: Record<string, unknown>): ValidatedPayload | { error: string } {
  const parsedUrl = parseImageUrl(payload.imageUrl);
  if ("error" in parsedUrl) return parsedUrl;

  const parsedWidth = parseOptionalNumber(payload.width, "width", { min: 1, max: 8192 });
  if ("error" in parsedWidth) return parsedWidth;

  const parsedHeight = parseOptionalNumber(payload.height, "height", { min: 1, max: 8192 });
  if ("error" in parsedHeight) return parsedHeight;

  const parsedQuality = parseOptionalNumber(payload.quality, "quality", { min: 1, max: 100 });
  if ("error" in parsedQuality) return parsedQuality;

  const format = payload.format ?? "webp";
  if (!VALID_FORMATS.has(format as never)) {
    return { error: `format must be one of: ${[...VALID_FORMATS].join(", ")}` };
  }

  const fit = payload.fit ?? "cover";
  if (!VALID_FITS.has(fit as never)) {
    return { error: `fit must be one of: ${[...VALID_FITS].join(", ")}` };
  }

  return {
    imageUrl: parsedUrl.value,
    operations: {
      width: parsedWidth.value,
      height: parsedHeight.value,
      quality: parsedQuality.value ?? 80,
      format: format as ImageOperation["format"],
      fit: fit as ImageOperation["fit"],
    },
  };
}

function applyCacheHeaders(response: NextResponse, maxAgeSeconds: number, swrSeconds: number) {
  response.headers.set(
    "Cache-Control",
    `public, s-maxage=${maxAgeSeconds}, max-age=${maxAgeSeconds}, stale-while-revalidate=${swrSeconds}`,
  );
  return response;
}

export function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const validation = validatePayload({
    imageUrl: sp.get("url"),
    width: sp.get("w"),
    height: sp.get("h"),
    quality: sp.get("q"),
    format: sp.get("f") ?? undefined,
    fit: sp.get("fit") ?? undefined,
  });

  if ("error" in validation) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const signedUrl = generateOptStuffUrl(
    validation.imageUrl,
    validation.operations,
    SIGNED_URL_TTL_SECONDS,
  );
  const response = NextResponse.redirect(signedUrl, 302);
  return applyCacheHeaders(response, REDIRECT_CACHE_SECONDS, REDIRECT_SWR_SECONDS);
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validation = validatePayload(body);
  if ("error" in validation) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const optimizedUrl = generateOptStuffUrl(
    validation.imageUrl,
    validation.operations,
    SIGNED_URL_TTL_SECONDS,
  );

  const response = NextResponse.json({ url: optimizedUrl });
  return applyCacheHeaders(response, JSON_CACHE_SECONDS, JSON_SWR_SECONDS);
}
