import { cn } from "@/lib/utils";

type CodeBlockProps = {
  readonly code: string;
  readonly label?: string;
  readonly className?: string;
  readonly variant?: "default" | "compact";
};

export function CodeBlock({
  code,
  label,
  className,
  variant = "default",
}: CodeBlockProps) {
  if (variant === "compact" && label) {
    return (
      <div className={cn("rounded-xl bg-[#18181b] p-4", className)}>
        <p className="mb-2 text-xs text-[#71717a]">{label}</p>
        <code className="font-mono text-sm break-all text-[#a1a1aa]">
          {code}
        </code>
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-md bg-[#18181b]", className)}>
      <pre className="overflow-x-auto p-4">
        <code className="font-mono text-sm text-[#a1a1aa]">{code}</code>
      </pre>
    </div>
  );
}
