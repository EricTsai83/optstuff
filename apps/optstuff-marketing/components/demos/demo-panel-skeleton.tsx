import { ControlCard, DemoLayout } from "@/components/demos/layouts";
import { cn } from "@workspace/ui/lib/utils";

export type DemoSkeletonVariant = "format" | "quality" | "effects";

function SkeletonBlock({ className }: { readonly className: string }) {
  return <div className={cn("bg-muted/80", className)} />;
}

function DemoHeaderSkeleton({
  hasAction = true,
  actionClassName = "h-10 w-28 rounded-xl",
}: {
  readonly hasAction?: boolean;
  readonly actionClassName?: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-end gap-3">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
          <SkeletonBlock className="ring-border/70 h-10 w-10 rounded-full shadow-md ring-1" />
        </div>
        <div className="min-w-0 space-y-1 pb-0.5">
          <SkeletonBlock className="h-5 w-40 rounded-full" />
          <SkeletonBlock className="bg-muted/60 h-3 w-64 max-w-[62vw] rounded-full" />
        </div>
      </div>
      {hasAction && (
        <SkeletonBlock
          className={cn("hidden shrink-0 sm:block", actionClassName)}
        />
      )}
    </div>
  );
}

function SliderCardSkeleton({
  labelClassName = "w-28",
  valueClassName = "w-14",
}: {
  readonly labelClassName?: string;
  readonly valueClassName?: string;
}) {
  return (
    <ControlCard>
      <div className="mb-2 flex items-center justify-between">
        <SkeletonBlock className={cn("h-4 rounded-full", labelClassName)} />
        <SkeletonBlock className={cn("h-8 rounded-lg", valueClassName)} />
      </div>
      <div className="relative flex h-5 items-center">
        <SkeletonBlock className="h-1.5 w-full rounded-full" />
        <SkeletonBlock className="bg-background ring-muted absolute left-2/3 h-5 w-5 rounded-full ring-2" />
      </div>
      <div className="mt-3 flex justify-between">
        <SkeletonBlock className="bg-muted/60 h-3 w-20 rounded-full" />
        <SkeletonBlock className="bg-muted/60 h-3 w-24 rounded-full" />
      </div>
    </ControlCard>
  );
}

function CodeCardSkeleton({
  labelClassName = "w-16",
}: {
  readonly labelClassName?: string;
}) {
  return (
    <ControlCard>
      <SkeletonBlock className={cn("mb-2 h-4 rounded-full", labelClassName)} />
      <div className="border-border flex items-center justify-between gap-4 rounded-xl border bg-[#18181b] px-4 py-1">
        <SkeletonBlock className="h-5 flex-1 rounded-full bg-zinc-700" />
        <SkeletonBlock className="h-7 w-7 rounded-md bg-zinc-700" />
      </div>
    </ControlCard>
  );
}

function ImagePreviewSkeleton({
  footer = false,
}: {
  readonly footer?: boolean;
}) {
  return (
    <div className="bg-muted/50 flex min-h-[280px] w-full items-center justify-center rounded-xl p-4 lg:col-span-2">
      <div className="flex w-full max-w-md flex-col items-center gap-2.5">
        <SkeletonBlock className="aspect-4/3 bg-muted/70 ring-border w-full rounded-lg ring-1" />
        {footer && (
          <div className="flex w-full items-center gap-2 pt-1">
            <SkeletonBlock className="bg-accent/25 h-5 w-5 rounded-full" />
            <SkeletonBlock className="h-4 w-28 rounded-full" />
            <SkeletonBlock className="bg-muted/60 h-4 w-16 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
}

function FormatOptionSkeleton({
  active = false,
}: {
  readonly active?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-xl border-2 px-4 py-3",
        active ? "border-accent bg-accent/5" : "bg-muted/50 border-transparent",
      )}
    >
      <div className="flex items-center gap-3">
        <SkeletonBlock
          className={cn(
            "ring-muted-foreground/40 h-4 w-4 rounded-full ring-1",
            active ? "bg-accent/25" : "bg-background",
          )}
        />
        <SkeletonBlock className="h-4 w-14 rounded-full" />
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <SkeletonBlock className="h-4 w-12 rounded-full" />
        <SkeletonBlock className="bg-muted/60 h-3 w-20 rounded-full" />
      </div>
    </div>
  );
}

function FormatDemoSkeleton() {
  return (
    <DemoLayout controlsColSpan={2} previewColSpan={2}>
      <div className="space-y-3 lg:col-span-2">
        <SkeletonBlock className="h-5 w-28 rounded-full" />
        <div className="space-y-0.5">
          <FormatOptionSkeleton active />
          <FormatOptionSkeleton />
          <FormatOptionSkeleton />
          <FormatOptionSkeleton />
        </div>
        <CodeCardSkeleton labelClassName="w-16" />
      </div>

      <ImagePreviewSkeleton footer />
    </DemoLayout>
  );
}

function EffectSliderSkeleton() {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-3 w-16 rounded-full" />
        <SkeletonBlock className="bg-muted/60 h-3 w-8 rounded-full" />
      </div>
      <div className="relative flex h-5 items-center">
        <SkeletonBlock className="h-1.5 w-full rounded-full" />
        <SkeletonBlock className="bg-background ring-muted absolute left-1/3 h-5 w-5 rounded-full ring-2" />
      </div>
    </div>
  );
}

function ToggleRowSkeleton() {
  return (
    <div className="flex items-end justify-center gap-3 pb-1 sm:gap-4">
      <SkeletonBlock className="h-5 w-16 rounded-full" />
      <SkeletonBlock className="h-5 w-16 rounded-full" />
    </div>
  );
}

function EffectsSectionSkeleton({
  sliderCount,
}: {
  readonly sliderCount: 3 | 5;
}) {
  return (
    <ControlCard>
      <div className="mb-3 flex items-center justify-between">
        <SkeletonBlock className="bg-muted/60 h-3 w-28 rounded-full" />
        <div className="flex items-center gap-1.5">
          <SkeletonBlock className="bg-muted/60 h-3 w-5 rounded-full" />
          <SkeletonBlock className="h-5 w-9 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
        {Array.from({ length: sliderCount }, (_, index) => (
          <EffectSliderSkeleton key={index} />
        ))}
        <ToggleRowSkeleton />
      </div>
    </ControlCard>
  );
}

function EffectsDemoSkeleton() {
  return (
    <DemoLayout controlsColSpan={2} previewColSpan={2}>
      <div className="w-full space-y-3 lg:col-span-2">
        <EffectsSectionSkeleton sliderCount={3} />
        <EffectsSectionSkeleton sliderCount={5} />
        <CodeCardSkeleton labelClassName="w-16" />
      </div>

      <ImagePreviewSkeleton />
    </DemoLayout>
  );
}

function PreviewCardSkeleton({
  optimized = false,
}: {
  readonly optimized?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-linear-to-b rounded-2xl border p-2.5 shadow-sm",
        optimized
          ? "border-emerald-300 from-emerald-50 to-white dark:border-emerald-500/20 dark:from-emerald-500/5 dark:to-transparent"
          : "border-gray-200 from-gray-50 to-white dark:border-white/10 dark:from-white/5 dark:to-transparent",
      )}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <SkeletonBlock
          className={cn(
            "h-3 w-16 rounded-full",
            optimized ? "bg-emerald-500/25" : "bg-muted/60",
          )}
        />
        <SkeletonBlock
          className={cn(
            "h-5 w-14 rounded-full",
            optimized ? "bg-emerald-500/20" : "bg-muted/60",
          )}
        />
      </div>
      <SkeletonBlock
        className={cn(
          "aspect-4/3 rounded-xl",
          optimized ? "bg-emerald-500/10" : "bg-muted/70",
        )}
      />
    </div>
  );
}

function StatCardSkeleton({
  highlight = false,
}: {
  readonly highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 rounded-lg p-2",
        highlight
          ? "bg-emerald-100 ring-1 ring-emerald-500/30 dark:bg-emerald-500/10 dark:ring-emerald-500/20"
          : "bg-gray-100 dark:bg-white/5",
      )}
    >
      <div className="flex items-center gap-2">
        <SkeletonBlock
          className={cn(
            "h-4 w-4 rounded-full",
            highlight ? "bg-emerald-500/25" : "bg-muted/70",
          )}
        />
        <SkeletonBlock
          className={cn(
            "h-3 w-14 rounded-full",
            highlight ? "bg-emerald-500/25" : "bg-muted/60",
          )}
        />
      </div>
      <SkeletonBlock
        className={cn(
          "h-6 w-16 rounded-full",
          highlight ? "bg-emerald-500/25" : "bg-muted/80",
        )}
      />
    </div>
  );
}

function QualityPreviewSkeleton() {
  return (
    <div className="space-y-3 lg:col-span-3">
      <div className="relative grid grid-cols-2 gap-2.5">
        <PreviewCardSkeleton />
        <PreviewCardSkeleton optimized />
      </div>
      <SkeletonBlock className="bg-muted/60 mx-auto h-3 w-48 rounded-full" />
      <div className="grid grid-cols-3 gap-2.5">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton highlight />
      </div>
    </div>
  );
}

function SavingsVisualizerSkeleton() {
  return (
    <div className="dark:bg-white/2 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/10">
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="bg-muted/60 h-4 w-4 rounded-full" />
          <SkeletonBlock className="h-4 w-36 rounded-full" />
          <SkeletonBlock className="bg-muted/60 hidden h-3 w-20 rounded-full sm:block" />
        </div>
        <div className="flex items-center gap-2">
          <SkeletonBlock className="bg-accent/15 h-7 w-16 rounded-full" />
          <SkeletonBlock className="bg-muted/60 h-4 w-4 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function QualityDemoSkeleton() {
  return (
    <>
      <DemoLayout controlsColSpan={2} previewColSpan={3}>
        <div className="space-y-4.5 lg:col-span-2">
          <SliderCardSkeleton labelClassName="w-28" valueClassName="w-16" />
          <SliderCardSkeleton labelClassName="w-36" valueClassName="w-20" />
          <CodeCardSkeleton labelClassName="w-16" />
        </div>

        <QualityPreviewSkeleton />
      </DemoLayout>

      <SavingsVisualizerSkeleton />
    </>
  );
}

export function DemoPanelSkeleton({
  variant,
}: {
  readonly variant: DemoSkeletonVariant;
}) {
  const headerSkeleton = (
    <DemoHeaderSkeleton
      hasAction={variant !== "quality"}
      actionClassName={
        variant === "effects" ? "h-8 w-24 rounded-md" : undefined
      }
    />
  );

  return (
    <div aria-hidden="true" className="h-full animate-pulse space-y-4">
      {headerSkeleton}
      {variant === "quality" ? (
        <QualityDemoSkeleton />
      ) : variant === "effects" ? (
        <EffectsDemoSkeleton />
      ) : (
        <FormatDemoSkeleton />
      )}
    </div>
  );
}
