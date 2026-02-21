import type { ReactNode } from "react";

type DemoHeaderProps = {
  readonly icon: ReactNode;
  readonly title: string;
  readonly description: string;
  readonly action?: ReactNode;
};

export function DemoHeader({
  icon,
  title,
  description,
  action,
}: DemoHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-end gap-3">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
          <div className="bg-primary/20 absolute inset-0 hidden rounded-full dark:block" />
          <div className="bg-background absolute inset-px rounded-full" />
          <div className="border-border from-background to-muted bg-linear-to-b relative flex h-10 w-10 items-center justify-center rounded-full border shadow-md dark:h-9 dark:w-9">
            <div className="text-foreground">{icon}</div>
          </div>
        </div>
        <div className="min-w-0 space-y-1">
          <h3 className="text-lg font-semibold leading-none tracking-tight">
            {title}
          </h3>
          <p className="text-muted-foreground text-xs">{description}</p>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
