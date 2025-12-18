import { cn } from "@/lib/utils";

type CodeBlockProps = {
  readonly code: string;
  readonly className?: string;
};

export function CodeBlock({ code, className }: CodeBlockProps) {
  return (
    <div className={cn("overflow-hidden rounded-md bg-[#18181b]", className)}>
      <pre className="overflow-x-auto p-4">
        <code className="font-mono text-sm text-[#a1a1aa]">{code}</code>
      </pre>
    </div>
  );
}
