"use client";

import { ResizeDemo } from "@/components/demos/resize-demo";
import { SectionHeader, SectionWrapper } from "@/components/ui/section";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useRef } from "react";
import type { SlidingTabItem } from "@workspace/ui/components/sliding-tabs";
import { SlidingTabs } from "@workspace/ui/components/sliding-tabs";

type DemoTabValue = "resize" | "format" | "quality" | "effects";

function DemoPanelSkeleton() {
  return (
    <div className="flex min-h-[360px] items-center justify-center lg:h-[520px]">
      <div className="w-full animate-pulse rounded-[28px] border border-border/70 bg-linear-to-br from-background via-muted/20 to-background p-4 shadow-sm sm:p-5">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-muted/80 mt-0.5 h-10 w-10 rounded-2xl ring-1 ring-border/60" />
              <div className="space-y-2 pt-0.5">
                <div className="bg-muted h-4 w-32 rounded-full" />
                <div className="bg-muted/70 h-3 w-52 max-w-[60vw] rounded-full" />
              </div>
            </div>
            <div className="hidden rounded-xl border border-border/50 bg-background/60 px-3 py-2 sm:block">
              <div className="bg-muted/80 h-3 w-18 rounded-full" />
              <div className="bg-muted mt-2 h-4 w-20 rounded-full" />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <div className="space-y-3 lg:col-span-2">
              <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="bg-muted h-3.5 w-24 rounded-full" />
                  <div className="bg-muted/80 h-7 w-14 rounded-lg" />
                </div>
                <div className="bg-muted/80 h-2.5 w-full rounded-full" />
                <div className="mt-3 flex justify-between">
                  <div className="bg-muted/60 h-2.5 w-16 rounded-full" />
                  <div className="bg-muted/60 h-2.5 w-20 rounded-full" />
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="bg-muted h-3.5 w-28 rounded-full" />
                  <div className="bg-muted/75 h-7 w-18 rounded-lg" />
                </div>
                <div className="bg-muted/75 h-2.5 w-full rounded-full" />
                <div className="mt-3 flex justify-between">
                  <div className="bg-muted/60 h-2.5 w-12 rounded-full" />
                  <div className="bg-muted/60 h-2.5 w-24 rounded-full" />
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                <div className="bg-muted mb-3 h-3.5 w-20 rounded-full" />
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-muted/80 h-8 rounded-xl" />
                  <div className="bg-muted/70 h-8 rounded-xl" />
                  <div className="bg-muted/60 h-8 rounded-xl" />
                </div>
              </div>
            </div>

            <div className="space-y-3 lg:col-span-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-2xl border border-border/60 bg-muted/35 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="bg-muted h-3 w-14 rounded-full" />
                    <div className="bg-muted/70 h-5 w-12 rounded-full" />
                  </div>
                  <div className="bg-muted/80 aspect-4/3 rounded-xl" />
                </div>

                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="bg-muted h-3 w-16 rounded-full" />
                    <div className="h-5 w-14 rounded-full bg-emerald-500/20" />
                  </div>
                  <div className="aspect-4/3 rounded-xl bg-linear-to-br from-muted/80 via-muted/60 to-emerald-500/15" />
                </div>
              </div>

              <div className="bg-muted/60 mx-auto h-3 w-44 rounded-full" />

              <div className="grid grid-cols-3 gap-2.5">
                <div className="rounded-2xl border border-border/60 bg-background/75 p-3">
                  <div className="bg-muted/70 mb-2 h-3 w-10 rounded-full" />
                  <div className="bg-muted h-5 w-16 rounded-full" />
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/75 p-3">
                  <div className="bg-muted/70 mb-2 h-3 w-12 rounded-full" />
                  <div className="bg-muted h-5 w-14 rounded-full" />
                </div>
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-3">
                  <div className="bg-muted/70 mb-2 h-3 w-10 rounded-full" />
                  <div className="h-5 w-18 rounded-full bg-emerald-500/25" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const loadFormatDemo = () =>
  import("@/components/demos/format-demo").then((mod) => mod.FormatDemo);
const loadQualityDemo = () =>
  import("@/components/demos/quality-demo").then((mod) => mod.QualityDemo);
const loadEffectsDemo = () =>
  import("@/components/demos/effects-demo").then((mod) => mod.EffectsDemo);

const FormatDemoLazy = dynamic(loadFormatDemo, {
  ssr: false,
  loading: DemoPanelSkeleton,
});
const QualityDemoLazy = dynamic(loadQualityDemo, {
  ssr: false,
  loading: DemoPanelSkeleton,
});
const EffectsDemoLazy = dynamic(loadEffectsDemo, {
  ssr: false,
  loading: DemoPanelSkeleton,
});

export function ImageOptimizationDemo() {
  const prefetchedTabsRef = useRef<ReadonlySet<DemoTabValue>>(new Set(["resize"]));

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
