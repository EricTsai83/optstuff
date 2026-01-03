"use client";

import { AspectRatio } from "@workspace/ui/components/aspect-ratio";
import { useFlashOnChange } from "@/hooks/use-flash-on-change";

type ImagePreviewProps = {
  readonly imageUrl: string;
  readonly imageAlt: string;
  readonly containerClassName?: string;
  readonly imageClassName?: string;
  readonly wrapperStyle?: React.CSSProperties;
  readonly imageContainerStyle?: React.CSSProperties;
  readonly imageStyle?: React.CSSProperties;
  readonly footer?: React.ReactNode;
  readonly imageContainerClassName?: string;
  readonly aspectRatio?: number;
};

/**
 * Reusable image preview component for demo display
 */
export function ImagePreview({
  imageUrl,
  imageAlt,
  containerClassName = "",
  imageClassName = "",
  wrapperStyle,
  imageContainerStyle,
  imageStyle,
  footer,
  imageContainerClassName = "",
  aspectRatio = 4 / 3,
}: ImagePreviewProps) {
  // Handle flash animation on props change using hook, returns style object
  const flashStyle = useFlashOnChange({
    values: {
      imageUrl,
      imageContainerStyle,
      imageStyle,
      aspectRatio,
    },
  });

  return (
    <div
      className={`bg-muted/50 flex min-h-[280px] w-full items-center justify-center rounded-xl p-4 lg:col-span-2 ${containerClassName}`}
      style={{ ...wrapperStyle, ...flashStyle }}
    >
      <div className="flex w-full max-w-md flex-col items-center gap-2.5">
        <AspectRatio ratio={aspectRatio} className="w-full">
          <div
            className={`ring-border h-full w-full overflow-hidden rounded-lg ring-1 transition-all duration-300 ${imageContainerClassName}`}
            style={imageContainerStyle}
          >
            <img
              src={imageUrl}
              alt={imageAlt}
              className={`h-full w-full object-cover transition-all duration-300 ${imageClassName}`}
              style={imageStyle}
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        </AspectRatio>
        {footer}
      </div>
    </div>
  );
}
