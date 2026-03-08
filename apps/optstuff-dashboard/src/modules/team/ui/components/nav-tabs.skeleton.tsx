const TAB_WIDTHS = ["w-16", "w-12", "w-14"];

export function NavTabsSkeleton() {
  return (
    <div className="border-border bg-background sticky top-0 z-50 border-b pt-1">
      <div className="flex h-[46px] items-center">
        {TAB_WIDTHS.map((w, i) => (
          <div
            key={i}
            className="flex flex-1 items-center justify-center border-b-2 border-transparent py-3"
          >
            <div className={`bg-muted h-4 ${w} animate-pulse rounded`} />
          </div>
        ))}
      </div>
    </div>
  );
}
