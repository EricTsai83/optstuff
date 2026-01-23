import { Badge } from "@workspace/ui/components/badge";
import { cn } from "@workspace/ui/lib/utils";
import type { ReactNode } from "react";

type PreviewCardProps = {
  readonly children: ReactNode;
  readonly label: string;
  readonly badge?: string | number;
  readonly variant?: "default" | "optimized";
  readonly className?: string;
};

export function PreviewCard({
  children,
  label,
  badge,
  variant = "default",
  className = "",
}: PreviewCardProps) {
  const isOptimized = variant === "optimized";

  const containerClasses = isOptimized
    ? "group relative overflow-hidden rounded-2xl border border-emerald-300 bg-linear-to-b from-emerald-50 to-white p-2.5 shadow-sm dark:border-emerald-500/20 dark:from-emerald-500/5 dark:to-transparent"
    : "group relative overflow-hidden rounded-2xl border border-gray-200 bg-linear-to-b from-gray-50 to-white p-2.5 shadow-sm dark:border-white/10 dark:from-white/5 dark:to-transparent";

  const labelClasses = isOptimized
    ? "text-xs font-medium text-emerald-600 dark:text-emerald-400"
    : "text-muted-foreground text-xs font-medium";

  const badgeClasses = isOptimized
    ? "border-emerald-300 bg-emerald-100 text-[10px] text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
    : "text-[10px]";

  const imageBgClasses = isOptimized
    ? "relative aspect-4/3 overflow-hidden rounded-xl bg-emerald-50 dark:bg-transparent"
    : "relative aspect-4/3 overflow-hidden rounded-xl bg-gray-100 dark:bg-transparent";

  return (
    <div className={cn(containerClasses, className)}>
      <div className="mb-1.5 flex items-center justify-between">
        <span className={labelClasses}>{label}</span>
        {badge && (
          <Badge variant="secondary" className={badgeClasses}>
            {badge}
          </Badge>
        )}
      </div>
      <div className={imageBgClasses}>{children}</div>
    </div>
  );
}
