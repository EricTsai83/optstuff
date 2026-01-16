"use client";

import {
  useState,
  useRef,
  useLayoutEffect,
  useCallback,
  useEffect,
} from "react";
import { TvMinimal } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@workspace/ui/components/tabs";
import { ResizeDemo } from "@/components/demos/resize-demo";
import { FormatDemo } from "@/components/demos/format-demo";
import { QualityDemo } from "@/components/demos/quality-demo";
import { EffectsDemo } from "@/components/demos/effects-demo";
import { SectionWrapper, SectionHeader } from "@/components/ui/section";

export function ImageOptimizationDemo() {
  const tabsListRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<DemoKey, HTMLButtonElement | null>>(new Map());
  const { activeTab, animation, handleTabChange } =
    useTabAnimation(DEFAULT_TAB);
  const indicatorStyle = useIndicatorPosition(tabRefs, tabsListRef, activeTab);

  const ActiveDemo = DEMOS[animation.displayedTab];

  return (
    <SectionWrapper id="demo">
      <SectionHeader
        icon={TvMinimal}
        badge="Live Demo"
        title="See it in action"
        description="Try different optimization options and see real-time results."
      />

      <div className="animate-scale-in animation-delay-400 mx-auto max-w-5xl">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          {/* Tabs navigation - scrollable on mobile */}
          <div className="mb-6 flex justify-center md:mb-8">
            <TabsList
              ref={tabsListRef}
              className="bg-muted text-muted-foreground relative h-10 w-full max-w-[calc(100vw-2rem)] overflow-x-auto rounded-full p-1 scrollbar-hide sm:h-11 sm:w-auto"
            >
              {/* Sliding indicator with squash-and-stretch effect */}
              <div
                className={cn(
                  "bg-background absolute top-1 h-8 rounded-full shadow-sm sm:h-9",
                  "transition-[left,width,opacity] duration-300 ease-out",
                  indicatorStyle.isSquashing &&
                    "animate-indicator-squash-stretch",
                  indicatorStyle.width === 0 ? "opacity-0" : "opacity-100",
                )}
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
                  className={cn(
                    "relative z-10 cursor-pointer rounded-full bg-transparent",
                    "px-3 py-1.5 text-xs font-medium capitalize sm:px-5 sm:py-2 sm:text-sm",
                    "border-none shadow-none",
                    "transition-colors duration-300",
                    "data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                    "dark:data-[state=active]:bg-transparent dark:data-[state=active]:shadow-none",
                  )}
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Demo content card - fixed height to prevent layout shifts */}
          <div className="lg:h-[600px]">
            <div className="bg-card border-border overflow-hidden rounded-xl border shadow-sm transition-shadow duration-500 hover:shadow-lg sm:rounded-2xl">
              {/* Hidden TabsContent to maintain Radix accessibility */}
              {DEMO_KEYS.map((tab) => (
                <TabsContent key={tab} value={tab} className="hidden" />
              ))}
              <div
                className={cn(
                  "h-full overflow-y-auto p-4 sm:p-6 md:p-8",
                  getAnimationClass(animation),
                )}
              >
                <ActiveDemo />
              </div>
            </div>
          </div>
        </Tabs>
      </div>
    </SectionWrapper>
  );
}

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
      setIsSquashing(false);
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
