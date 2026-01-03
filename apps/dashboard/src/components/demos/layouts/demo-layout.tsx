import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type DemoLayoutProps = {
  readonly children: ReactNode;
  readonly controlsColSpan?: 2 | 3;
  readonly previewColSpan?: 2 | 3;
  readonly className?: string;
};

export function DemoLayout({
  children,
  controlsColSpan = 2,
  previewColSpan = 3,
  className = "",
}: DemoLayoutProps) {
  const gridCols = controlsColSpan + previewColSpan;
  const gridClass = (() => {
    switch (gridCols) {
      case 4:
        return "lg:grid-cols-4";
      case 5:
        return "lg:grid-cols-5";
      case 6:
        return "lg:grid-cols-6";
      default:
        return "lg:grid-cols-2";
    }
  })();

  return (
    <div className={cn("grid grid-cols-1 gap-4", gridClass, className)}>
      {children}
    </div>
  );
}
