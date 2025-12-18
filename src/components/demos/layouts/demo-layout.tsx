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
  const gridClass =
    gridCols === 5
      ? "lg:grid-cols-5"
      : gridCols === 4
        ? "lg:grid-cols-4"
        : "lg:grid-cols-2";

  return (
    <div className={`grid gap-8 ${gridClass} ${className}`}>{children}</div>
  );
}
