"use client";

import { cn } from "@/lib/utils";

type SkeletonOverlayProps = {
  readonly isVisible: boolean;
};

/**
 * Skeleton loading overlay with soundwave ripple animation.
 *
 * Displays while the canvas grid is initializing, then fades out
 * once the first draw is complete.
 */
export function SkeletonOverlay({ isVisible }: SkeletonOverlayProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 z-10 transition-opacity duration-500 will-change-[opacity]",
        isVisible ? "opacity-100" : "opacity-0",
      )}
    >
      {/* Gradient background layers */}
      <div className="from-accent/12 to-accent/10 absolute inset-0 bg-linear-to-b via-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(16,185,129,0.18)_0%,transparent_68%)]" />
      <div className="animate-pulse-soft absolute inset-0 bg-white/4 dark:bg-black/6" />

      {/* Soundwave ripple rings */}
      <SoundwaveRipples />
    </div>
  );
}

/**
 * Animated soundwave ripple rings emanating from center.
 */
function SoundwaveRipples() {
  return (
    <div className="absolute top-1/2 left-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2">
      {/* Core pulse dot */}
      <div className="bg-accent/50 absolute top-1/2 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_16px_rgba(16,185,129,0.7)]" />

      {/* Wave rings with staggered delays */}
      <RippleWave
        borderWidth="border-4"
        borderOpacity="border-accent/45"
        shadowOpacity="shadow-[0_0_24px_rgba(16,185,129,0.25)]"
        delay={0}
      />
      <RippleWave
        borderWidth="border-[3px]"
        borderOpacity="border-accent/35"
        shadowOpacity="shadow-[0_0_20px_rgba(16,185,129,0.2)]"
        delay={400}
      />
      <RippleWave
        borderWidth="border-2"
        borderOpacity="border-accent/28"
        shadowOpacity="shadow-[0_0_16px_rgba(16,185,129,0.15)]"
        delay={800}
      />
      <RippleWave
        borderWidth="border-2"
        borderOpacity="border-accent/20"
        shadowOpacity="shadow-[0_0_12px_rgba(16,185,129,0.1)]"
        delay={1200}
      />
      <RippleWave
        borderWidth="border"
        borderOpacity="border-accent/14"
        shadowOpacity="shadow-[0_0_10px_rgba(16,185,129,0.08)]"
        delay={1600}
      />
    </div>
  );
}

type RippleWaveProps = {
  readonly borderWidth: string;
  readonly borderOpacity: string;
  readonly shadowOpacity: string;
  readonly delay: number;
};

function RippleWave({
  borderWidth,
  borderOpacity,
  shadowOpacity,
  delay,
}: RippleWaveProps) {
  return (
    <div
      className={cn(
        "animate-hero-soundwave absolute inset-0 rounded-full",
        borderWidth,
        borderOpacity,
        shadowOpacity,
      )}
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}
