"use client";

import { formatBytes, formatNumber } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { ChevronDown, ImageIcon } from "lucide-react";
import { useState } from "react";

const COLLAPSED_COUNT = 3;

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
  const [expanded, setExpanded] = useState(false);
  const hasMore = images.length > COLLAPSED_COUNT;
  const visibleImages = expanded ? images : images.slice(0, COLLAPSED_COUNT);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Images</CardTitle>
          <CardDescription>Most requested images</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          <div>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="border-border/30 flex items-center gap-3 border-b px-4 py-2.5 last:border-0"
              >
                <div className="bg-muted h-4 w-4 animate-pulse rounded" />
                <div className="bg-muted h-4 w-48 animate-pulse rounded" />
                <div className="bg-muted ml-auto h-4 w-20 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className="pb-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Top Images
          </CardTitle>
          <CardDescription>Most requested images</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          {images.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center text-sm">
              No image requests yet
            </div>
          ) : (
            <div>
              {visibleImages.map((image, index) => (
                <div
                  key={image.sourceUrl}
                  className="border-border/30 hover:bg-muted/40 flex items-center gap-3 border-b px-4 py-2 transition-colors last:border-0"
                >
                  <span className="text-muted-foreground w-5 shrink-0 text-right text-xs tabular-nums">
                    {index + 1}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="min-w-0 flex-1 truncate font-mono text-sm">
                        <span className="sm:hidden">
                          {extractPathname(image.sourceUrl)}
                        </span>
                        <span className="hidden sm:inline">
                          {image.sourceUrl}
                        </span>
                      </p>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-sm">
                      <p className="break-all font-mono text-xs">
                        {image.sourceUrl}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <div className="text-muted-foreground flex shrink-0 items-center gap-3 text-xs tabular-nums">
                    <span>{formatNumber(image.requestCount)} req</span>
                    <span className="hidden sm:inline">
                      {formatBytes(image.totalOptimizedSize)}
                    </span>
                  </div>
                </div>
              ))}
              {hasMore && (
                <button
                  type="button"
                  onClick={() => setExpanded((prev) => !prev)}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted/40 flex w-full items-center justify-center gap-1 px-4 py-2 text-xs transition-colors"
                >
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
                  />
                  {expanded
                    ? "Show less"
                    : `Show ${images.length - COLLAPSED_COUNT} more`}
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
