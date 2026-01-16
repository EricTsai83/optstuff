"use client";

import { cn } from "@workspace/ui/lib/utils";

type StatCardProps = {
  readonly value: string | number;
  readonly label: string;
  readonly icon: React.ReactNode;
  readonly highlight?: boolean;
};

export function StatCard({
  value,
  label,
  icon,
  highlight = false,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center gap-1 rounded-lg p-2 transition-colors",
        highlight
          ? "bg-emerald-100 ring-1 ring-emerald-500/30 dark:bg-emerald-500/10 dark:ring-emerald-500/20"
          : "bg-gray-100 dark:bg-white/5",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2",
          highlight
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-muted-foreground",
        )}
      >
        {icon}
        <p
          className={cn(
            "text-muted-foreground text-[9px] tracking-wider uppercase",
            highlight && "text-emerald-600 dark:text-emerald-400",
          )}
        >
          {label}
        </p>
      </div>
      <p
        className={cn(
          "text-foreground font-mono text-lg font-bold",
          highlight && "text-emerald-600 dark:text-emerald-400",
        )}
      >
        {value}
      </p>
    </div>
  );
}
