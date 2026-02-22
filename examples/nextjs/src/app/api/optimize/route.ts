import { generateOptStuffUrl, type ImageOperation } from "@/lib/optstuff";
import { NextRequest, NextResponse } from "next/server";

const VALID_FORMATS = new Set(["webp", "avif", "png", "jpg"] as const);
const VALID_FITS = new Set(["cover", "contain", "fill"] as const);

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
    3600,
  );

  return NextResponse.json({ url: optimizedUrl });
}
