import { cn } from "@workspace/ui/lib/utils";
import { CopyButton } from "./copy-button";

type CodeBlockProps = {
  readonly code: string;
  readonly label?: string;
  readonly className?: string;
  readonly variant?: "default" | "compact";
};

export function CodeBlock({ code, className }: CodeBlockProps) {
  return (
    <div
      className={cn(
        "border-border flex items-center justify-between gap-4 rounded-xl border bg-[#18181b] px-4 py-1",
        className,
      )}
    >
      <code className="text-accent-foreground scrollbar-hide min-w-0 flex-1 overflow-x-auto font-mono text-sm text-nowrap">
        {code}
      </code>
      <CopyButton text={code} className="hover:border-none" />
    </div>
  );
}
