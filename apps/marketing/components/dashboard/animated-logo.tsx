"use client";

import { useScroll } from "@/hooks/use-scroll";
import { LogoIcon } from "@/components/logo";
import { SCROLL_CONFIG } from "./scroll-config";
import { cn } from "@workspace/ui/lib/utils";

export function AnimatedLogo() {
  const scrollY = useScroll();

  const maxScroll = SCROLL_CONFIG.MAX_SCROLL;
  const {
    MIN_SIZE: minSize,
    MAX_SIZE: maxSize,
    MIN_TOP: minTop,
    MAX_TOP: maxTop,
  } = SCROLL_CONFIG.LOGO;

  let size: number;
  let top: number;
  if (scrollY >= maxScroll) {
    size = minSize;
    top = minTop;
  } else {
    const progress = scrollY / maxScroll;
    size = maxSize - (maxSize - minSize) * progress;
    top = maxTop - (maxTop - minTop) * progress;
  }

  return (
    <div
      className={cn(
        "relative md:fixed",
        "left-10 z-9999 -translate-x-1/2",
        "md:-translate-y-1/2",
      )}
      style={{ top: `${top}px` }}
    >
      <LogoIcon size={size} />
    </div>
  );
}
