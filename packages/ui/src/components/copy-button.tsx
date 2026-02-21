"use client";

import { cn } from "@workspace/ui/lib/utils";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

type CopyButtonProps = {
  readonly text: string;
  readonly className?: string;
};

export function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      aria-label={copied ? "Copied" : "Copy to clipboard"}
      className={cn(
        "relative inline-flex items-center justify-center",
        "h-9 w-9 rounded-md",
        "hover:border-border hover:cursor-pointer hover:border",
        "active:scale-95",
        "text-accent-foreground",
        "focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        className,
      )}
    >
      <Copy
        className={cn(
          "h-4 w-4 transition-all duration-300",
          copied ? "scale-0 opacity-0" : "scale-100 opacity-100",
        )}
      />
      <Check
        className={cn(
          "absolute h-5 w-5 text-green-400 transition-all duration-300",
          copied ? "scale-100 opacity-100" : "scale-0 opacity-0",
        )}
      />
      <span className="sr-only">{copied ? "Copied" : "Copy to clipboard"}</span>
    </button>
  );
}
