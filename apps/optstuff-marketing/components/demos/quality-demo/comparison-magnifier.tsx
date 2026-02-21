"use client";

import { Badge } from "@workspace/ui/components/badge";

type ComparisonMagnifierProps = {
  readonly originalImageUrl: string;
  readonly optimizedImageUrl: string;
  readonly imagePos: { x: number; y: number };
  readonly isVisible: boolean;
  readonly zoom?: number;
  readonly height?: number;
};

export function ComparisonMagnifier({
  originalImageUrl,
  optimizedImageUrl,
  imagePos,
  isVisible,
  zoom = 5,
  height = 120,
}: ComparisonMagnifierProps) {
  // Guard: ensure zoom > 1 to avoid division by zero or negative in (1 - zoom)
  const MIN_ZOOM = 1.01;
  const validZoom = zoom > 1 ? zoom : MIN_ZOOM;

  // Calculate background position; uses centered fallback if original zoom was invalid
  const bgPosition =
    zoom > 1
      ? `${((0.5 - imagePos.x * validZoom) / (1 - validZoom)) * 100}% ${((0.5 - imagePos.y * validZoom) / (1 - validZoom)) * 100}%`
      : "50% 50%";

  return (
    <div
      className="pointer-events-none absolute bottom-0 left-0 right-0 z-30 col-span-2 translate-y-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-xl transition-all duration-300 ease-out dark:border-white/10 dark:bg-gray-900"
      style={{
        height: isVisible ? `${height}px` : "0px",
        marginTop: "12px",
        opacity: isVisible ? 1 : 0,
      }}
    >
      <div className="relative grid h-full grid-cols-2">
        {/* Original side */}
        <div className="relative h-full w-full overflow-hidden">
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `url(${originalImageUrl})`,
              backgroundSize: `${validZoom * 100}%`,
              backgroundPosition: bgPosition,
              backgroundRepeat: "no-repeat",
            }}
          />
          <div className="bg-linear-to-t absolute inset-x-0 bottom-0 from-black/60 to-transparent px-3 pb-2 pt-6">
            <Badge
              variant="secondary"
              className="border-white/20 bg-white/10 text-[10px] text-white/90 backdrop-blur-sm"
            >
              Original
            </Badge>
          </div>
        </div>

        {/* Center divider */}
        <div className="absolute bottom-0 left-1/2 top-0 z-10 flex -translate-x-1/2 flex-col items-center">
          <div className="h-full w-px bg-white shadow-sm" />
          <div className="absolute top-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-gray-900 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg">
            VS
          </div>
        </div>

        {/* Optimized side */}
        <div className="relative h-full w-full overflow-hidden">
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `url(${optimizedImageUrl})`,
              backgroundSize: `${validZoom * 100}%`,
              backgroundPosition: bgPosition,
              backgroundRepeat: "no-repeat",
            }}
          />
          <div className="bg-linear-to-t absolute inset-x-0 bottom-0 flex justify-end from-black/50 to-transparent px-3 pb-2 pt-6">
            <Badge
              variant="secondary"
              className="border-white/20 bg-white/10 text-[10px] text-white/90 backdrop-blur-sm"
            >
              Optimized
            </Badge>
          </div>
        </div>
      </div>

      {/* Zoom indicator */}
      <div className="absolute right-2 top-2 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur-sm">
        {validZoom}x
      </div>
    </div>
  );
}
