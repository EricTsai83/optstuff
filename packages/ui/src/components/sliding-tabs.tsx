"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { cn } from "@workspace/ui/lib/utils";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

// ============================================================================
// Types
// ============================================================================

export type SlidingTabItem<TValue extends string> = {
  value: TValue;
  label: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
};

type AnimationPhase = "idle" | "exiting" | "entering";
type SlideDirection = "left" | "right";

type ContentAnimation = {
  displayedTab: string;
  phase: AnimationPhase;
  direction: SlideDirection;
};

type IndicatorPosition = {
  x: number;
  width: number;
  ready: boolean;
};

export type SlidingTabsProps<TValue extends string> = {
  items: SlidingTabItem<TValue>[];
  value?: TValue;
  defaultValue?: TValue;
  onValueChange?: (value: TValue) => void;
  onTriggerPrefetch?: (value: TValue) => void;
  className?: string;
  listWrapperClassName?: string;
  listClassName?: string;
  triggerClassName?: string;
  indicatorClassName?: string;
  contentWrapperClassName?: string;
  contentCardClassName?: string;
  contentClassName?: string;
  animationDuration?: { exit: number; enter: number };
};

// ============================================================================
// Helpers
// ============================================================================

function getSlideClass({ phase, direction }: ContentAnimation): string {
  if (phase === "idle") return "";
  if (phase === "exiting") {
    return direction === "left"
      ? "animate-tab-slide-out-to-left"
      : "animate-tab-slide-out-to-right";
  }
  return direction === "left"
    ? "animate-tab-slide-in-from-right"
    : "animate-tab-slide-in-from-left";
}

const DEFAULT_DURATION = { exit: 150, enter: 250 };

// ============================================================================
// Component
// ============================================================================

/**
 * Tabs with a performance-optimized sliding indicator and directional
 * content transitions.
 *
 * - Indicator uses translateX (compositor-only, no layout thrashing)
 * - Scroll/resize measurements are rAF-throttled with passive listeners
 * - ResizeObserver tracks container and trigger size changes
 * - Squash-and-stretch indicator animation on tab change
 * - Respects prefers-reduced-motion via motion-reduce:
 */
export function SlidingTabs<TValue extends string>({
  items,
  value: controlledValue,
  defaultValue,
  onValueChange,
  onTriggerPrefetch,
  className,
  listWrapperClassName,
  listClassName,
  triggerClassName,
  indicatorClassName,
  contentWrapperClassName,
  contentCardClassName,
  contentClassName,
  animationDuration = DEFAULT_DURATION,
}: SlidingTabsProps<TValue>) {
  const firstValue = items[0]?.value;

  const [internalValue, setInternalValue] = useState<TValue | undefined>(
    defaultValue ?? firstValue,
  );
  const activeValue = controlledValue ?? internalValue ?? firstValue;
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // -- Indicator --
  const listRef = useRef<HTMLDivElement | null>(null);
  const triggerRefs = useRef<Map<TValue, HTMLButtonElement | null>>(new Map());
  const rafRef = useRef<number | null>(null);
  const prevTabRef = useRef<TValue | undefined>(activeValue);
  const prevActiveValueRef = useRef<TValue | undefined>(activeValue);
  const squashRafRef = useRef<number | null>(null);
  const [indicator, setIndicator] = useState<IndicatorPosition>({
    x: 0,
    width: 0,
    ready: false,
  });
  const [isSquashing, setIsSquashing] = useState(false);

  // -- Content animation --
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [animation, setAnimation] = useState<ContentAnimation>({
    displayedTab: (activeValue as string) ?? "",
    phase: "idle",
    direction: "left",
  });

  const measure = useCallback((): void => {
    const container = listRef.current;
    const trigger = activeValue ? triggerRefs.current.get(activeValue) : null;

    if (!container || !trigger) {
      setIndicator((prev) => (prev.ready ? { ...prev, ready: false } : prev));
      return;
    }

    const cRect = container.getBoundingClientRect();
    const tRect = trigger.getBoundingClientRect();
    const x = tRect.left - cRect.left + container.scrollLeft;
    const w = tRect.width;

    const tabChanged = prevTabRef.current !== activeValue;
    if (tabChanged) {
      prevTabRef.current = activeValue;
      if (squashRafRef.current !== null)
        cancelAnimationFrame(squashRafRef.current);
      setIsSquashing(false);
      if (!prefersReducedMotion) {
        squashRafRef.current = requestAnimationFrame(() => {
          squashRafRef.current = requestAnimationFrame(() => {
            squashRafRef.current = null;
            setIsSquashing(true);
          });
        });
      }
    }

    setIndicator((prev) => {
      if (
        Math.abs(prev.x - x) < 0.5 &&
        Math.abs(prev.width - w) < 0.5 &&
        prev.ready
      )
        return prev;
      return { x, width: w, ready: w > 0 };
    });
  }, [activeValue, prefersReducedMotion]);

  const scheduleMeasure = useCallback((): void => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      measure();
    });
  }, [measure]);

  const clearTimers = useCallback((): void => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const runContentTransition = useCallback(
    (fromValue: TValue, toValue: TValue): void => {
      clearTimers();

      if (fromValue === toValue) {
        setAnimation((prev) => ({
          ...prev,
          displayedTab: toValue as string,
          phase: "idle",
        }));
        return;
      }

      const curIdx = items.findIndex((i) => i.value === fromValue);
      const nxtIdx = items.findIndex((i) => i.value === toValue);
      const direction: SlideDirection =
        curIdx === -1 || nxtIdx === -1 || nxtIdx > curIdx ? "left" : "right";

      if (prefersReducedMotion) {
        setAnimation({
          displayedTab: toValue as string,
          phase: "idle",
          direction,
        });
        return;
      }

      setAnimation({
        displayedTab: fromValue as string,
        phase: "exiting",
        direction,
      });

      const exitTimer = setTimeout(() => {
        setAnimation({
          displayedTab: toValue as string,
          phase: "entering",
          direction,
        });
        const enterTimer = setTimeout(() => {
          setAnimation((prev) => ({ ...prev, phase: "idle" }));
        }, animationDuration.enter);
        timersRef.current.push(enterTimer);
      }, animationDuration.exit);
      timersRef.current.push(exitTimer);
    },
    [
      animationDuration.enter,
      animationDuration.exit,
      clearTimers,
      items,
      prefersReducedMotion,
    ],
  );

  const handleValueChange = useCallback(
    (next: string): void => {
      const nextValue = next as TValue;
      if (nextValue === activeValue) return;

      if (controlledValue === undefined) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue);
      if (controlledValue !== undefined) return;
    },
    [activeValue, controlledValue, onValueChange],
  );

  // -- Effects --

  useLayoutEffect(() => {
    measure();
  }, [measure, activeValue]);

  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    container.addEventListener("scroll", scheduleMeasure, { passive: true });
    window.addEventListener("resize", scheduleMeasure);
    return () => {
      container.removeEventListener("scroll", scheduleMeasure);
      window.removeEventListener("resize", scheduleMeasure);
    };
  }, [scheduleMeasure]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    updatePreference();
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updatePreference);
      return () => mediaQuery.removeEventListener("change", updatePreference);
    }

    mediaQuery.addListener(updatePreference);
    return () => mediaQuery.removeListener(updatePreference);
  }, []);

  useEffect(() => {
    if (!prefersReducedMotion) return;

    clearTimers();
    if (squashRafRef.current !== null) {
      cancelAnimationFrame(squashRafRef.current);
      squashRafRef.current = null;
    }
    setIsSquashing(false);

    if (activeValue) {
      setAnimation((prev) => ({
        ...prev,
        displayedTab: activeValue as string,
        phase: "idle",
      }));
    }
  }, [activeValue, clearTimers, prefersReducedMotion]);

  useEffect(() => {
    const prevActiveValue = prevActiveValueRef.current;

    if (!activeValue) {
      prevActiveValueRef.current = activeValue;
      return;
    }

    if (prevActiveValue && prevActiveValue !== activeValue) {
      runContentTransition(prevActiveValue, activeValue);
    } else if (!prevActiveValue) {
      setAnimation((prev) => ({
        ...prev,
        displayedTab: activeValue as string,
        phase: "idle",
      }));
    }

    prevActiveValueRef.current = activeValue;
  }, [activeValue, runContentTransition]);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(scheduleMeasure);
    const container = listRef.current;
    if (container) observer.observe(container);
    triggerRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [scheduleMeasure]);

  useEffect(
    () => () => {
      clearTimers();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (squashRafRef.current !== null)
        cancelAnimationFrame(squashRafRef.current);
    },
    [clearTimers],
  );

  // -- Render --

  if (!items.length || !activeValue) return null;
  const renderedTabValue = (animation.displayedTab || activeValue) as TValue;

  return (
    <Tabs
      value={renderedTabValue}
      onValueChange={handleValueChange}
      className={cn("w-full", className)}
    >
      <div className={cn("flex justify-center", listWrapperClassName)}>
        <TabsList
          ref={listRef}
          className={cn(
            "bg-muted text-muted-foreground scrollbar-hide relative overflow-x-auto rounded-full p-1",
            listClassName,
          )}
        >
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute bottom-1 left-0 top-1",
              prefersReducedMotion
                ? "transition-none will-change-transform"
                : "transition-[transform,width,opacity] duration-300 ease-out will-change-transform motion-reduce:transition-none",
              indicator.ready ? "opacity-100" : "opacity-0",
            )}
            style={{
              width: indicator.width,
              transform: `translateX(${indicator.x}px)`,
            }}
          >
            <div
              className={cn(
                "bg-background h-full w-full rounded-full shadow-sm",
                !prefersReducedMotion &&
                  isSquashing &&
                  "animate-indicator-squash-stretch",
                indicatorClassName,
              )}
            />
          </div>

          {items.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              disabled={item.disabled}
              onMouseEnter={() => onTriggerPrefetch?.(item.value)}
              onFocus={() => onTriggerPrefetch?.(item.value)}
              ref={(el) => {
                triggerRefs.current.set(item.value, el);
              }}
              className={cn(
                "relative z-10 cursor-pointer rounded-full bg-transparent",
                "whitespace-nowrap px-3 py-1.5 text-xs font-medium",
                "border-none shadow-none",
                "transition-colors duration-200",
                "data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                "dark:data-[state=active]:bg-transparent dark:data-[state=active]:shadow-none",
                "sm:px-5 sm:py-2 sm:text-sm",
                triggerClassName,
              )}
            >
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {items.map((item) => (
        <TabsContent key={item.value} value={item.value}>
          <div className={contentWrapperClassName}>
            <div className={contentCardClassName}>
              <div
                className={cn(
                  !prefersReducedMotion && item.value === animation.displayedTab
                    ? getSlideClass(animation)
                    : "",
                  contentClassName,
                )}
                style={
                  !prefersReducedMotion &&
                  item.value === animation.displayedTab &&
                  animation.phase !== "idle"
                    ? {
                        animationDuration: `${animation.phase === "entering" ? animationDuration.enter : animationDuration.exit}ms`,
                      }
                    : undefined
                }
              >
                {item.content}
              </div>
            </div>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
