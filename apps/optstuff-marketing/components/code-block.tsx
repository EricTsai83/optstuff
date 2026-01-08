import { cn } from "@workspace/ui/lib/utils";
import { CopyButton } from "./copy-button";

type CodeBlockProps = {
  readonly code: string;
  readonly className?: string;
  /**
   * - `inline`: 單行風格，copy button 在右側（適合短的 API URL）
   * - `block`: 多行區塊風格，copy button 在右上角（適合長的程式碼）
   */
  readonly variant?: "inline" | "block";
};

export function CodeBlock({
  code,
  className,
  variant = "inline",
}: CodeBlockProps) {
  return (
    <div
      className={cn(
        "border-border flex items-center justify-between gap-4 rounded-xl border bg-[#18181b] px-4 py-1",

        className,
      )}
    >
      <code
        className={cn(
          "text-accent-foreground scrollbar-hide min-w-0 flex-1 overflow-x-auto font-mono text-sm",
          variant === "inline" && "text-nowrap",
          variant === "block" && "whitespace-pre-wrap py-4 px-3",
        )}
      >
        {code}
      </code>
      <CopyButton text={code} className="hover:border-none" />
    </div>
  );
}
