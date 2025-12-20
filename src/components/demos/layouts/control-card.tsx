import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type ControlCardProps = {
  readonly children: ReactNode;
  readonly className?: string;
};

export function ControlCard({ children, className = "" }: ControlCardProps) {
  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-gray-200 bg-linear-to-b from-gray-50 to-white px-4 py-3",
        "dark:border-white/10 dark:from-white/5 dark:to-transparent",
        className,
      )}
    >
      {children}
    </div>
  );
}
