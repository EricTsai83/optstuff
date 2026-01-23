"use client";

import { SectionHeader, SectionWrapper } from "@/components/ui/section";
import { useIntersectionVisibility } from "@/hooks/use-intersection-visibility";
import { cn } from "@workspace/ui/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  Code,
  Globe,
  ImageIcon,
  Layers,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { useCallback, useState } from "react";

type Feature = {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description: string;
  readonly animation: string;
};

const FEATURES: readonly Feature[] = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Built on sharp and libvips for sub-millisecond image processing.",
    animation: "icon-zap",
  },
  {
    icon: Shield,
    title: "Secure by Default",
    description:
      "Domain whitelisting and signed URLs prevent unauthorized access.",
    animation: "icon-shield",
  },
  {
    icon: Globe,
    title: "Edge Optimized",
    description: "Deploy globally with automatic caching at the edge.",
    animation: "icon-globe",
  },
  {
    icon: Code,
    title: "Simple API",
    description: "URL-based modifiers for resize, crop, format, and more.",
    animation: "icon-code",
  },
  {
    icon: Layers,
    title: "Format Support",
    description: "WebP, AVIF, JPEG, PNG, GIF, and SVG optimization.",
    animation: "icon-layers",
  },
  {
    icon: ImageIcon,
    title: "Auto Optimization",
    description: "Intelligent format selection based on browser support.",
    animation: "icon-image",
  },
];

const ANIMATION_DELAY_MS = 100;

export function Features() {
  const { visibleItems: visibleCards, setItemRef } =
    useIntersectionVisibility<HTMLDivElement>(FEATURES.length);
  const [animatedCards, setAnimatedCards] = useState<ReadonlySet<number>>(
    () => new Set(),
  );

  const handleAnimationEnd = useCallback(
    (e: React.AnimationEvent<HTMLDivElement>, index: number): void => {
      if (e.animationName === "feature-card-enter") {
        setAnimatedCards((prev) => new Set(prev).add(index));
      }
    },
    [],
  );

  return (
    <SectionWrapper id="features" maxWidth="5xl">
      <SectionHeader
        icon={Sparkles}
        badge="Features"
        title="Everything you need"
        description="Powerful features for developers who care about performance."
        className="mb-10 sm:mb-16"
      />

      {/* Feature grid */}
      <div className="mx-auto grid max-w-5xl gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, index) => (
          <div key={feature.title} ref={setItemRef(index)}>
            <FeatureCard
              feature={feature}
              index={index}
              isVisible={visibleCards.has(index)}
              isAnimated={animatedCards.has(index)}
              onAnimationEnd={handleAnimationEnd}
            />
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}

type FeatureCardProps = {
  readonly feature: Feature;
  readonly index: number;
  readonly isVisible: boolean;
  readonly isAnimated: boolean;
  readonly onAnimationEnd: (
    e: React.AnimationEvent<HTMLDivElement>,
    index: number,
  ) => void;
};

function FeatureCard({
  feature,
  index,
  isVisible,
  isAnimated,
  onAnimationEnd,
}: FeatureCardProps) {
  const Icon = feature.icon;

  const cardClassName = cn(
    "group rounded-xl p-4 sm:rounded-2xl sm:p-6 border border-transparent",
    "hover:border-border hover:bg-muted/30",
    "active:scale-[0.98] transition-transform",
    isAnimated
      ? "feature-card-hover opacity-100"
      : isVisible
        ? "animate-feature-card-enter"
        : "opacity-0",
  );

  const animationDelay = isVisible
    ? `${index * ANIMATION_DELAY_MS}ms`
    : undefined;

  return (
    <div
      className={cardClassName}
      onAnimationEnd={(e) => onAnimationEnd(e, index)}
      style={{ animationDelay }}
    >
      <div
        className={cn(
          "bg-muted group-hover:bg-accent/10 mb-3 flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-500 sm:mb-4 sm:h-10 sm:w-10 sm:rounded-xl",
          `icon-container-${feature.animation}`,
        )}
      >
        <Icon
          className={cn(
            "text-muted-foreground group-hover:text-accent h-4 w-4 transition-colors duration-300 sm:h-5 sm:w-5",
            feature.animation,
          )}
        />
      </div>
      <h3 className="mb-1 text-sm font-semibold sm:mb-2 sm:text-base">
        {feature.title}
      </h3>
      <p className="text-muted-foreground text-xs leading-relaxed sm:text-sm">
        {feature.description}
      </p>
    </div>
  );
}
