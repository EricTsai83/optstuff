import { HeaderShell } from "@/components/header-shell";
import { TeamSwitcherSkeleton } from "@/modules/team";

export function HeaderSkeleton() {
  return (
    <HeaderShell
      desktopLeft={
        <>
          <div className="relative md:fixed z-9999 left-10 -translate-x-1/2 md:-translate-y-1/2" style={{ top: "32px" }}>
            <div className="bg-muted h-7 w-7 animate-pulse rounded" />
          </div>
          <div className="ml-15 flex items-center gap-2">
            <span
              className="text-muted-foreground text-lg"
              aria-hidden="true"
            >
              /
            </span>
            <TeamSwitcherSkeleton />
          </div>
        </>
      }
      mobileLeft={<TeamSwitcherSkeleton />}
      desktopRight={
        <>
          <div className="bg-muted h-8 w-48 animate-pulse rounded" />
          <div className="bg-muted h-8 w-8 animate-pulse rounded" />
          <div className="bg-muted h-8 w-8 animate-pulse rounded" />
          <div className="bg-muted h-8 w-8 animate-pulse rounded-full" />
        </>
      }
      mobileRight={
        <>
          <div className="bg-muted h-9 w-9 animate-pulse rounded" />
          <div className="bg-muted h-9 w-9 animate-pulse rounded" />
          <div className="bg-muted h-9 w-9 animate-pulse rounded" />
        </>
      }
    />
  );
}
