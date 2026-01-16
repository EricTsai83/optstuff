"use client";

import type { LucideIcon } from "lucide-react";
import { Code, Globe, ImageIcon, Layers, Shield, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@workspace/ui/lib/utils";

type Feature = {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description: string;
  readonly animation: string;
};

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

export function Features() {
  const { cardRefs, visibleCards, animatedCards, handleAnimationEnd } =
    useCardVisibility(FEATURES.length);

  return (
    <section id="features" className="bg-background py-16 sm:py-24">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="mb-10 text-center sm:mb-16">
          <p className="text-accent animate-fade-in mb-2 text-sm font-medium sm:mb-3">
            Features
          </p>
          <h2 className="animate-fade-in-up animation-delay-100 mb-3 text-2xl font-bold tracking-tight sm:mb-4 sm:text-3xl md:text-4xl">
            Everything you need
          </h2>
          <p className="text-muted-foreground animate-fade-in-up animation-delay-200 mx-auto max-w-lg text-sm sm:text-base">
            Powerful features for developers who care about performance.
          </p>
        </div>

        {/* Feature grid */}
        <div className="mx-auto grid max-w-5xl gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <div
              key={feature.title}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
            >
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
      </div>
    </section>
  );
}

const INTERSECTION_THRESHOLD = 0.2;

function useCardVisibility(cardCount: number): {
  readonly cardRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  readonly visibleCards: ReadonlySet<number>;
  readonly animatedCards: ReadonlySet<number>;
  readonly handleAnimationEnd: (
    e: React.AnimationEvent<HTMLDivElement>,
    index: number,
  ) => void;
} {
  const [visibleCards, setVisibleCards] = useState<ReadonlySet<number>>(
    () => new Set(),
  );
  const [animatedCards, setAnimatedCards] = useState<ReadonlySet<number>>(
    () => new Set(),
  );
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleAnimationEnd = useCallback(
    (e: React.AnimationEvent<HTMLDivElement>, index: number): void => {
      if (e.animationName === "feature-card-enter") {
        setAnimatedCards((prev) => new Set(prev).add(index));
      }
    },
    [],
  );

  useEffect(() => {
    const currentRefs = cardRefs.current;
    const observers: IntersectionObserver[] = [];

    currentRefs.forEach((ref, index) => {
      if (!ref) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            setVisibleCards((prev) => new Set(prev).add(index));
            observer.disconnect();
          }
        },
        { threshold: INTERSECTION_THRESHOLD },
      );

      observer.observe(ref);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [cardCount]);

  return { cardRefs, visibleCards, animatedCards, handleAnimationEnd };
}

const ANIMATION_DELAY_MS = 100;

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
