import { generateOptStuffUrl, type ImageOperation } from "@/lib/optstuff-core";
import { type NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

const VALID_FORMATS = new Set(["webp", "avif", "png", "jpg"] as const);
const VALID_FITS = new Set(["cover", "contain", "fill"] as const);

const SIGNED_URL_TTL_SECONDS = 3600;
const REDIRECT_CACHE_SECONDS = 300;
const REDIRECT_SWR_SECONDS = 3600;
const JSON_CACHE_SECONDS = 300;
const JSON_SWR_SECONDS = 3600;
const SIGNING_RATE_LIMIT_WINDOW_MS = 60_000;
const SIGNING_RATE_LIMIT_MAX_REQUESTS = 60;
const GLOBAL_SIGNING_RATE_LIMIT_MAX_REQUESTS = 300;
const GLOBAL_SIGNING_RATE_LIMIT_ID = "global";
const SIGNING_SESSION_COOKIE = "optstuff_demo_signing_session";
const SIGNING_SESSION_MAX_AGE_SECONDS = 60 * 60;

const DEFAULT_ALLOWED_IMAGE_URLS = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
];

const DEFAULT_ALLOWED_HOSTS = ["images.unsplash.com"];
const ALLOW_ARBITRARY_HOST_SIGNING =
  process.env.OPTSTUFF_ALLOW_ARBITRARY_HOST_SIGNING === "true";
const ALLOWED_IMAGE_URLS = new Set(
  (
    process.env.OPTSTUFF_ALLOWED_IMAGE_URLS ??
    DEFAULT_ALLOWED_IMAGE_URLS.join(",")
  )
    .split(",")
    .map((url) => normalizeImageUrl(url))
    .filter((url): url is string => Boolean(url)),
);
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

type RateLimitBucket = {
  count: number;
  resetAt: number;
};
type SigningSession = {
  id: string;
  token: string;
  fresh: boolean;
};

const signingRateLimitBuckets = new Map<string, RateLimitBucket>();

function getSigningSessionSecret(): string {
  const secret = process.env.OPTSTUFF_SECRET_KEY;
  if (!secret) {
    throw new Error("Missing OPTSTUFF_SECRET_KEY");
  }
  return secret;
}

function normalizeImageUrl(value: string): string | null {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(value.trim());
  } catch {
    return null;
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    return null;
  }

  return parsedUrl.toString();
}

function signSessionId(id: string): string {
  return crypto
    .createHmac("sha256", getSigningSessionSecret())
    .update(id)
    .digest("base64url");
}

function timingSafeEqualString(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.byteLength === rightBuffer.byteLength &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function createSigningSession(): SigningSession {
  const id = crypto.randomBytes(16).toString("base64url");
  const signature = signSessionId(id);
  return { id, token: `${id}.${signature}`, fresh: true };
}

function getSigningSession(request: NextRequest): SigningSession {
  const token = request.cookies.get(SIGNING_SESSION_COOKIE)?.value;
  if (token) {
    const [id, signature] = token.split(".");
    if (
      id &&
      signature &&
      timingSafeEqualString(signature, signSessionId(id))
    ) {
      return { id, token, fresh: false };
    }
  }

  return createSigningSession();
}

function attachSigningSessionCookie(
  response: NextResponse,
  session: SigningSession,
): NextResponse {
  if (!session.fresh) return response;

  response.cookies.set({
    name: SIGNING_SESSION_COOKIE,
    value: session.token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SIGNING_SESSION_MAX_AGE_SECONDS,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function checkSigningRateLimit(
  identifier: string,
  limit: number,
): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  const now = Date.now();
  const current = signingRateLimitBuckets.get(identifier);

  if (!current || current.resetAt <= now) {
    signingRateLimitBuckets.set(identifier, {
      count: 1,
      resetAt: now + SIGNING_RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { allowed: true };
}

function checkSigningRateLimitForRequest(
  request: NextRequest,
):
  | { allowed: true; session: SigningSession }
  | { allowed: false; session: SigningSession; retryAfterSeconds: number } {
  const session = getSigningSession(request);
  const globalRateLimit = checkSigningRateLimit(
    GLOBAL_SIGNING_RATE_LIMIT_ID,
    GLOBAL_SIGNING_RATE_LIMIT_MAX_REQUESTS,
  );
  if (!globalRateLimit.allowed) {
    return { ...globalRateLimit, session };
  }

  const sessionRateLimit = checkSigningRateLimit(
    session.id,
    SIGNING_RATE_LIMIT_MAX_REQUESTS,
  );
  return sessionRateLimit.allowed
    ? { allowed: true, session }
    : { ...sessionRateLimit, session };
}

function rateLimitResponse(session: SigningSession, retryAfterSeconds: number) {
  return attachSigningSessionCookie(
    NextResponse.json(
      { error: "Too many signing requests" },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSeconds) },
      },
    ),
    session,
  );
}

function isAllowedHostname(hostname: string) {
  const normalized = hostname.toLowerCase();
  for (const allowedHost of ALLOWED_HOSTS) {
    if (normalized === allowedHost || normalized.endsWith(`.${allowedHost}`)) {
      return true;
    }
  }
  return false;
}

function isAllowedImageUrl(url: string) {
  if (ALLOWED_IMAGE_URLS.has(url)) return true;
  if (!ALLOW_ARBITRARY_HOST_SIGNING) return false;

  const parsed = new URL(url);
  return isAllowedHostname(parsed.hostname);
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

  const normalizedUrl = parsedUrl.toString();
  if (!isAllowedImageUrl(normalizedUrl)) {
    return {
      error:
        "imageUrl/url is not allowed. Configure OPTSTUFF_ALLOWED_IMAGE_URLS or explicitly enable OPTSTUFF_ALLOW_ARBITRARY_HOST_SIGNING.",
    };
  }

  return { value: normalizedUrl };
}

function parseOptionalNumber(
  value: unknown,
  name: string,
  { min, max }: NumberParseOptions = {},
): { value: number | undefined } | { error: string } {
  if (value === undefined || value === null || value === "")
    return { value: undefined };
  const n = Number(value);
  if (Number.isNaN(n) || !Number.isFinite(n)) {
    return { error: `${name} must be a valid number` };
  }

  if (!Number.isInteger(n)) {
    return { error: `${name} must be an integer` };
  }
  if (min !== undefined && n < min) {
    return { error: `${name} must be >= ${min}` };
  }
  if (max !== undefined && n > max) {
    return { error: `${name} must be <= ${max}` };
  }
  return { value: n };
}

function validatePayload(
  payload: Record<string, unknown>,
): ValidatedPayload | { error: string } {
  const parsedUrl = parseImageUrl(payload.imageUrl);
  if ("error" in parsedUrl) return parsedUrl;

  const parsedWidth = parseOptionalNumber(payload.width, "width", {
    min: 1,
    max: 8192,
  });
  if ("error" in parsedWidth) return parsedWidth;

  const parsedHeight = parseOptionalNumber(payload.height, "height", {
    min: 1,
    max: 8192,
  });
  if ("error" in parsedHeight) return parsedHeight;

  const parsedQuality = parseOptionalNumber(payload.quality, "quality", {
    min: 1,
    max: 100,
  });
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

function applyCacheHeaders(
  response: NextResponse,
  maxAgeSeconds: number,
  swrSeconds: number,
) {
  response.headers.set(
    "Cache-Control",
    `public, s-maxage=${maxAgeSeconds}, max-age=${maxAgeSeconds}, stale-while-revalidate=${swrSeconds}`,
  );
  return response;
}

export function GET(request: NextRequest) {
  const rateLimit = checkSigningRateLimitForRequest(request);
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.session, rateLimit.retryAfterSeconds);
  }

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
    return attachSigningSessionCookie(
      NextResponse.json({ error: validation.error }, { status: 400 }),
      rateLimit.session,
    );
  }

  const signedUrl = generateOptStuffUrl(
    validation.imageUrl,
    validation.operations,
    SIGNED_URL_TTL_SECONDS,
  );
  const response = NextResponse.redirect(signedUrl, 302);
  return attachSigningSessionCookie(
    applyCacheHeaders(response, REDIRECT_CACHE_SECONDS, REDIRECT_SWR_SECONDS),
    rateLimit.session,
  );
}

export async function POST(request: NextRequest) {
  const rateLimit = checkSigningRateLimitForRequest(request);
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.session, rateLimit.retryAfterSeconds);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return attachSigningSessionCookie(
      NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
      rateLimit.session,
    );
  }

  const validation = validatePayload(body);
  if ("error" in validation) {
    return attachSigningSessionCookie(
      NextResponse.json({ error: validation.error }, { status: 400 }),
      rateLimit.session,
    );
  }

  const optimizedUrl = generateOptStuffUrl(
    validation.imageUrl,
    validation.operations,
    SIGNED_URL_TTL_SECONDS,
  );

  const response = NextResponse.json({ url: optimizedUrl });
  return attachSigningSessionCookie(
    applyCacheHeaders(response, JSON_CACHE_SECONDS, JSON_SWR_SECONDS),
    rateLimit.session,
  );
}
