import { Search } from "lucide-react";

type MiniDashboardHeaderProps = {
  /** Additional breadcrumb segments after "my-team" (e.g., ["my-app"]) */
  readonly extraSegments?: readonly string[];
};

/** Simplified dashboard header mimicking the real dashboard chrome */
export function MiniDashboardHeader({
  extraSegments,
}: MiniDashboardHeaderProps) {
  return (
    <div className="bg-background border-border/50 flex items-center justify-between border-b px-2 py-1 sm:px-3 sm:py-1.5">
      {/* Left: Logo + breadcrumb path */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        <div className="bg-foreground h-2.5 w-2.5 rounded-sm sm:h-3 sm:w-3" />
        <span className="text-muted-foreground text-[7px] sm:text-[9px]">
          /
        </span>
        <span className="text-foreground text-[7px] font-medium sm:text-[9px]">
          my-team
        </span>
        {extraSegments?.map((segment) => (
          <span key={segment} className="flex items-center gap-1 sm:gap-1.5">
            <span className="text-muted-foreground text-[7px] sm:text-[9px]">
              /
            </span>
            <span className="text-foreground text-[7px] font-medium sm:text-[9px]">
              {segment}
            </span>
          </span>
        ))}
      </div>

      {/* Right: Search + Avatar */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        <div className="bg-secondary hidden items-center gap-0.5 rounded px-1.5 py-0.5 sm:flex">
          <Search className="text-muted-foreground h-2 w-2" />
          <span className="text-muted-foreground text-[7px]">Find...</span>
        </div>
        <div className="bg-muted h-2.5 w-2.5 rounded-full sm:h-3 sm:w-3" />
      </div>
    </div>
  );
}
