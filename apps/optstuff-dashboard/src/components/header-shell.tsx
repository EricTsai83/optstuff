import type { ReactNode } from "react";

type HeaderShellProps = {
  readonly desktopLeft: ReactNode;
  readonly mobileLeft: ReactNode;
  readonly desktopRight: ReactNode;
  readonly mobileRight: ReactNode;
};

export function HeaderShell({
  desktopLeft,
  mobileLeft,
  desktopRight,
  mobileRight,
}: HeaderShellProps) {
  return (
    <header className="border-border bg-background flex h-16 items-center justify-between border-b px-4">
      <div className="hidden items-center gap-2 md:flex">{desktopLeft}</div>
      <div className="flex items-center md:hidden">{mobileLeft}</div>
      <div className="hidden items-center gap-2 md:flex">{desktopRight}</div>
      <div className="flex items-center gap-1 md:hidden">{mobileRight}</div>
    </header>
  );
}
