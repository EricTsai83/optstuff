import { generateOptStuffUrl } from "@/lib/optstuff";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    imageUrl: string;
    width?: number;
    height?: number;
    quality?: number;
    format?: "webp" | "avif" | "png" | "jpg";
    fit?: "cover" | "contain" | "fill";
  };

  const { imageUrl, ...operations } = body;

  if (!imageUrl) {
    return NextResponse.json(
      { error: "imageUrl is required" },
      { status: 400 },
    );
  }

  const optimizedUrl = generateOptStuffUrl(imageUrl, operations, 3600);

  return NextResponse.json({ url: optimizedUrl });
}
