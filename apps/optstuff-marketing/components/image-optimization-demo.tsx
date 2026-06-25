"use client";

import { DemoPanelSkeleton } from "@/components/demos/demo-panel-skeleton";
import { ResizeDemo } from "@/components/demos/resize-demo";
import { SectionHeader, SectionWrapper } from "@/components/ui/section";
import type { SlidingTabItem } from "@workspace/ui/components/sliding-tabs";
import { SlidingTabs } from "@workspace/ui/components/sliding-tabs";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useRef } from "react";

type DemoTabValue = "resize" | "format" | "quality" | "effects";

const loadFormatDemo = () =>
  import("@/components/demos/format-demo").then((mod) => mod.FormatDemo);
const loadQualityDemo = () =>
  import("@/components/demos/quality-demo").then((mod) => mod.QualityDemo);
const loadEffectsDemo = () =>
  import("@/components/demos/effects-demo").then((mod) => mod.EffectsDemo);

const FormatDemoLazy = dynamic(loadFormatDemo, {
  ssr: false,
  loading: () => <DemoPanelSkeleton variant="format" />,
});
const QualityDemoLazy = dynamic(loadQualityDemo, {
  ssr: false,
  loading: () => <DemoPanelSkeleton variant="quality" />,
});
const EffectsDemoLazy = dynamic(loadEffectsDemo, {
  ssr: false,
  loading: () => <DemoPanelSkeleton variant="effects" />,
});

export function ImageOptimizationDemo() {
  const prefetchedTabsRef = useRef<ReadonlySet<DemoTabValue>>(
    new Set(["resize"]),
  );

  const handleTriggerPrefetch = useCallback((value: DemoTabValue) => {
    if (prefetchedTabsRef.current.has(value)) {
      return;
    }

    switch (value) {
      case "format":
        void loadFormatDemo();
        break;
      case "quality":
        void loadQualityDemo();
        break;
      case "effects":
        void loadEffectsDemo();
        break;
      default:
        return;
    }

    prefetchedTabsRef.current = new Set(prefetchedTabsRef.current).add(value);
  }, []);

  const demoItems = useMemo<SlidingTabItem<DemoTabValue>[]>(
    () => [
      { value: "resize", label: "resize", content: <ResizeDemo /> },
      { value: "format", label: "format", content: <FormatDemoLazy /> },
      { value: "quality", label: "quality", content: <QualityDemoLazy /> },
      { value: "effects", label: "effects", content: <EffectsDemoLazy /> },
    ],
    [],
  );

  return (
    <SectionWrapper id="demo" allowOverflow>
      <SectionHeader
        title="See it in action"
        description="Try different optimization options and see real-time results."
      />

      <div className="animate-scale-in animation-delay-400 mx-auto max-w-5xl">
        <SlidingTabs
          items={demoItems}
          defaultValue="resize"
          onTriggerPrefetch={handleTriggerPrefetch}
          listWrapperClassName="bg-background sticky top-[72px] z-40 -mx-4 mb-6 px-4 py-3 sm:-mx-6 sm:px-6 md:static md:mx-0 md:mb-8 md:bg-transparent md:px-0 md:py-0"
          listClassName="h-10 w-full max-w-[calc(100vw-2rem)] sm:h-11 sm:w-auto"
          triggerClassName="capitalize"
          contentWrapperClassName="lg:h-[600px]"
          contentCardClassName="bg-card border-border overflow-hidden rounded-xl border shadow-sm transition-shadow duration-500 hover:shadow-lg sm:rounded-2xl"
          contentClassName="h-full overflow-y-auto p-4 sm:p-6 md:p-8"
        />
      </div>
    </SectionWrapper>
  );
}
