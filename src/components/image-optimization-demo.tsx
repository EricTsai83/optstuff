"use client";

import {
  useState,
  useRef,
  useLayoutEffect,
  useCallback,
  useEffect,
} from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ResizeDemo } from "@/components/demos/resize-demo";
import { FormatDemo } from "@/components/demos/format-demo";
import { QualityDemo } from "@/components/demos/quality-demo";
import { EffectsDemo } from "@/components/demos/effects-demo";

// ============================================================================
// Constants & Types
// ============================================================================

const DEMOS = {
  resize: ResizeDemo,
  format: FormatDemo,
  quality: QualityDemo,
  effects: EffectsDemo,
} as const;

type DemoKey = keyof typeof DEMOS;

const DEMO_KEYS = Object.keys(DEMOS) as DemoKey[];
const DEFAULT_TAB: DemoKey = "resize";

const ANIMATION_DURATION = { exit: 150, enter: 250 } as const;

type AnimationPhase = "idle" | "exiting" | "entering";
type SlideDirection = "left" | "right";

type AnimationState = {
  readonly displayedTab: DemoKey;
  readonly phase: AnimationPhase;
  readonly direction: SlideDirection;
};

// ============================================================================
// Utilities
// ============================================================================

function getAnimationClass({ phase, direction }: AnimationState): string {
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

// ============================================================================
// Custom Hooks
// ============================================================================

type IndicatorStyle = {
  readonly left: number;
  readonly width: number;
  readonly isSquashing: boolean;
};

/**
 * Manages the tab indicator position based on active tab.
 * Also tracks squash animation state for velocity feel effect.
 *
 * Limitations:
 * - Requires `useLayoutEffect` to measure DOM before paint, avoiding visual flicker.
 * - Must listen to window resize to recalculate position when viewport changes.
 * - The `tabRefs` Map must be populated via ref callbacks on each TabsTrigger.
 */
function useIndicatorPosition(
  tabRefs: React.RefObject<Map<DemoKey, HTMLButtonElement | null>>,
  containerRef: React.RefObject<HTMLDivElement | null>,
  activeTab: DemoKey,
): IndicatorStyle {
  const [style, setStyle] = useState({ left: 0, width: 0 });
  const [isSquashing, setIsSquashing] = useState(false);
  const prevTabRef = useRef<DemoKey>(activeTab);

  useLayoutEffect(() => {
    const updateIndicator = (): void => {
      const container = containerRef.current;
      const activeButton = tabRefs.current?.get(activeTab);
      if (!container || !activeButton) return;

      const containerRect = container.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      setStyle({
        left: buttonRect.left - containerRect.left,
        width: buttonRect.width,
      });
    };

    // Detect tab change and trigger squash animation
    if (prevTabRef.current !== activeTab) {
      prevTabRef.current = activeTab;
      // Reset animation by toggling off then on
      setIsSquashing(false);
      // Use requestAnimationFrame to ensure the class is removed before re-adding
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsSquashing(true);
        });
      });
    }

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [tabRefs, containerRef, activeTab]);

  return { ...style, isSquashing };
}

/**
 * Manages tab switching animation state with directional slide transitions.
 *
 * Limitations:
 * - Uses setTimeout for animation sequencing; timers are cleaned up on unmount
 *   or when a new tab change interrupts the previous animation.
 */
function useTabAnimation(initialTab: DemoKey): {
  activeTab: DemoKey;
  animation: AnimationState;
  handleTabChange: (value: string) => void;
} {
  const [activeTab, setActiveTab] = useState<DemoKey>(initialTab);
  const [animation, setAnimation] = useState<AnimationState>({
    displayedTab: initialTab,
    phase: "idle",
    direction: "left",
  });
  const timerRefs = useRef<NodeJS.Timeout[]>([]);

  const clearTimers = useCallback((): void => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const handleTabChange = useCallback(
    (value: string): void => {
      if (value === activeTab) return;

      clearTimers();

      const newTab = value as DemoKey;
      const direction: SlideDirection =
        DEMO_KEYS.indexOf(newTab) > DEMO_KEYS.indexOf(activeTab)
          ? "left"
          : "right";

      setActiveTab(newTab);
      setAnimation({ displayedTab: activeTab, phase: "exiting", direction });

      const exitTimer = setTimeout(() => {
        setAnimation({ displayedTab: newTab, phase: "entering", direction });
        const enterTimer = setTimeout(() => {
          setAnimation((prev) => ({ ...prev, phase: "idle" }));
        }, ANIMATION_DURATION.enter);
        timerRefs.current.push(enterTimer);
      }, ANIMATION_DURATION.exit);
      timerRefs.current.push(exitTimer);
    },
    [activeTab, clearTimers],
  );

  return { activeTab, animation, handleTabChange };
}

// ============================================================================
// Main Component
// ============================================================================

export function ImageOptimizationDemo() {
  const tabsListRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<DemoKey, HTMLButtonElement | null>>(new Map());
  const { activeTab, animation, handleTabChange } =
    useTabAnimation(DEFAULT_TAB);
  const indicatorStyle = useIndicatorPosition(tabRefs, tabsListRef, activeTab);

  const ActiveDemo = DEMOS[animation.displayedTab];

  return (
    <div
      className="animate-scale-in animation-delay-400 animate-on-scroll mx-auto max-w-5xl"
      style={{ animationFillMode: "forwards" }}
    >
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <div className="mb-8 flex justify-center">
          <TabsList
            ref={tabsListRef}
            className="bg-muted text-muted-foreground relative h-11 rounded-full p-1"
          >
            {/* Sliding indicator with squash-and-stretch effect */}
            <div
              className={`bg-background absolute top-1 h-9 rounded-full shadow-sm transition-[left,width,opacity] duration-300 ease-out ${
                indicatorStyle.isSquashing
                  ? "animate-indicator-squash-stretch"
                  : ""
              } ${indicatorStyle.width === 0 ? "opacity-0" : "opacity-100"}`}
              style={{
                left: indicatorStyle.left,
                width: indicatorStyle.width,
              }}
              aria-hidden="true"
            />
            {DEMO_KEYS.map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                ref={(el) => {
                  tabRefs.current.set(tab, el);
                }}
                className="relative z-10 cursor-pointer rounded-full bg-transparent px-5 py-2 text-sm font-medium capitalize shadow-none transition-colors duration-300 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="bg-card border-border overflow-hidden rounded-2xl border p-6 shadow-sm transition-shadow duration-500 hover:shadow-lg md:p-8">
          {/* Hidden TabsContent to maintain Radix accessibility */}
          {DEMO_KEYS.map((tab) => (
            <TabsContent key={tab} value={tab} className="hidden" />
          ))}
          <div className={getAnimationClass(animation)}>
            <ActiveDemo />
          </div>
        </div>
      </Tabs>
    </div>
  );
}
