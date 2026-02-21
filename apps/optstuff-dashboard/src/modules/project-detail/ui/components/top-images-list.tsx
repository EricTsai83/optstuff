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
  sourceUrl: string;
  requestCount: number;
  totalOptimizedSize: number;
};

type TopImagesListProps = {
  readonly images: TopImage[];
  readonly isLoading?: boolean;
};

function truncateUrl(url: string, maxLength = 50): string {
  if (url.length <= maxLength) return url;
  return `${url.slice(0, maxLength - 3)}...`;
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
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-muted h-12 animate-pulse rounded-lg" />
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
          <div className="space-y-3">
            {images.map((image, index) => (
              <div
                key={image.sourceUrl}
                className="bg-muted/50 flex items-center gap-3 rounded-lg p-3"
              >
                <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate font-mono text-sm"
                    title={image.sourceUrl}
                  >
                    {truncateUrl(image.sourceUrl)}
                  </p>
                  <div className="text-muted-foreground flex gap-4 text-xs">
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
