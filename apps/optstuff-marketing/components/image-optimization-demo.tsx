"use client";

import { EffectsDemo } from "@/components/demos/effects-demo";
import { FormatDemo } from "@/components/demos/format-demo";
import { QualityDemo } from "@/components/demos/quality-demo";
import { ResizeDemo } from "@/components/demos/resize-demo";
import { SectionHeader, SectionWrapper } from "@/components/ui/section";
import type { SlidingTabItem } from "@workspace/ui/components/sliding-tabs";
import { SlidingTabs } from "@workspace/ui/components/sliding-tabs";

const DEMO_ITEMS: SlidingTabItem<string>[] = [
  { value: "resize", label: "resize", content: <ResizeDemo /> },
  { value: "format", label: "format", content: <FormatDemo /> },
  { value: "quality", label: "quality", content: <QualityDemo /> },
  { value: "effects", label: "effects", content: <EffectsDemo /> },
];

export function ImageOptimizationDemo() {
  return (
    <SectionWrapper id="demo" allowOverflow>
      <SectionHeader
        title="See it in action"
        description="Try different optimization options and see real-time results."
      />

      <div className="animate-scale-in animation-delay-400 mx-auto max-w-5xl">
        <SlidingTabs
          items={DEMO_ITEMS}
          defaultValue="resize"
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
