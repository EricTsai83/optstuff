"use client";

import { formatBytes, formatNumber } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { ImageIcon } from "lucide-react";

type TopImage = {
  readonly sourceUrl: string;
  readonly requestCount: number;
  readonly totalOptimizedSize: number;
};

type TopImagesListProps = {
  readonly images: TopImage[];
  readonly isLoading?: boolean;
};

function extractPathname(url: string): string {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    const filename = pathname.split("/").filter(Boolean).pop();
    return filename ?? pathname;
  } catch {
    const parts = url.split("/").filter(Boolean);
    return parts.pop() ?? url;
  }
}

export function TopImagesList({ images, isLoading }: TopImagesListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Images</CardTitle>
          <CardDescription>Most requested images</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 sm:space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-muted h-16 animate-pulse rounded-lg sm:h-12"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Top Images
        </CardTitle>
        <CardDescription>Most requested images</CardDescription>
      </CardHeader>
      <CardContent>
        {images.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center text-sm">
            No image requests yet
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {images.map((image, index) => (
              <div
                key={image.sourceUrl}
                className="bg-muted/50 flex items-start gap-2.5 rounded-lg p-2.5 sm:items-center sm:gap-3 sm:p-3"
              >
                <div className="bg-primary/10 text-primary mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium sm:mt-0 sm:h-8 sm:w-8 sm:text-sm">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-xs font-medium sm:font-mono sm:text-sm"
                    title={image.sourceUrl}
                  >
                    <span className="sm:hidden">
                      {extractPathname(image.sourceUrl)}
                    </span>
                    <span className="hidden sm:inline">{image.sourceUrl}</span>
                  </p>
                  <div className="text-muted-foreground mt-0.5 flex gap-3 text-[11px] sm:gap-4 sm:text-xs">
                    <span>{formatNumber(image.requestCount)} requests</span>
                    <span>{formatBytes(Number(image.totalOptimizedSize))}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
