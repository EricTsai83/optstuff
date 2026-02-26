import { type NextRequest, NextResponse } from "next/server";
import { generateOptStuffUrl, type ImageOperation } from "@/lib/optstuff";

const VALID_FORMATS = new Set(["webp", "avif", "png", "jpg"] as const);
const VALID_FITS = new Set(["cover", "contain", "fill"] as const);
const SIGNED_URL_TTL_SECONDS = 3600;
const REDIRECT_CACHE_SECONDS = 300;

/**
 * GET — Signing endpoint for the `next/image` custom loader.
 *
 * Accepts image parameters as query strings, generates a signed OptStuff URL,
 * and returns a 302 redirect. This lets `next/image` build a full responsive
 * `srcSet` while keeping signing on the server.
 */
export function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const url = sp.get("url");

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  const signedUrl = generateOptStuffUrl(
    url,
    {
      width: sp.has("w") ? Number(sp.get("w")) : undefined,
      height: sp.has("h") ? Number(sp.get("h")) : undefined,
      quality: sp.has("q") ? Number(sp.get("q")) : 80,
      format:
        (sp.get("f") as "webp" | "avif" | "png" | "jpg" | null) ?? "webp",
      fit: (sp.get("fit") as "cover" | "contain" | "fill" | null) ?? "cover",
    },
    SIGNED_URL_TTL_SECONDS,
  );
  const response = NextResponse.redirect(signedUrl, 302);
  response.headers.set(
    "Cache-Control",
    `public, s-maxage=${REDIRECT_CACHE_SECONDS}, max-age=0, stale-while-revalidate=86400`,
  );
  return response;
}

function parseOptionalNumber(
  value: unknown,
  name: string,
): { value: number | undefined } | { error: string } {
  if (value === undefined || value === null) return { value: undefined };
  const n = Number(value);
  if (Number.isNaN(n) || !Number.isFinite(n))
    return { error: `${name} must be a valid number` };
  return { value: Math.round(n) };
}

/**
 * POST — Returns a signed URL as JSON for the optimizer playground.
 *
 * Accepts a JSON body with `imageUrl`, `width`, `height`, `quality`,
 * `format`, and `fit`, then returns `{ url: "<signed-url>" }`.
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { imageUrl, width, height, quality, format, fit } = body;

  if (typeof imageUrl !== "string" || imageUrl.trim() === "") {
    return NextResponse.json(
      { error: "imageUrl is required and must be a non-empty string" },
      { status: 400 },
    );
  }

  const parsedWidth = parseOptionalNumber(width, "width");
  if ("error" in parsedWidth)
    return NextResponse.json({ error: parsedWidth.error }, { status: 400 });

  const parsedHeight = parseOptionalNumber(height, "height");
  if ("error" in parsedHeight)
    return NextResponse.json({ error: parsedHeight.error }, { status: 400 });

  const parsedQuality = parseOptionalNumber(quality, "quality");
  if ("error" in parsedQuality)
    return NextResponse.json({ error: parsedQuality.error }, { status: 400 });

  if (format !== undefined && !VALID_FORMATS.has(format as never)) {
    return NextResponse.json(
      { error: `format must be one of: ${[...VALID_FORMATS].join(", ")}` },
      { status: 400 },
    );
  }

  if (fit !== undefined && !VALID_FITS.has(fit as never)) {
    return NextResponse.json(
      { error: `fit must be one of: ${[...VALID_FITS].join(", ")}` },
      { status: 400 },
    );
  }

  const optimizedUrl = generateOptStuffUrl(
    imageUrl,
    {
      width: parsedWidth.value,
      height: parsedHeight.value,
      quality: parsedQuality.value,
      format: format as ImageOperation["format"],
      fit: fit as ImageOperation["fit"],
    },
    SIGNED_URL_TTL_SECONDS,
  );

  return NextResponse.json({ url: optimizedUrl });
}
