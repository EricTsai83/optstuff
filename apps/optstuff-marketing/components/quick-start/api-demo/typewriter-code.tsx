"use client";

import { cn } from "@workspace/ui/lib/utils";
import { Check, Copy } from "lucide-react";
import type { TypewriterCodeProps } from "../types";
import { SyntaxHighlight } from "./syntax-highlight";

export function TypewriterCode({
  code,
  copied = false,
  onCopy,
  variant,
}: TypewriterCodeProps) {
  const lines = code.split("\n");

  return (
    <div className="bg-card">
      <div className="border-border/50 flex items-center justify-between border-b px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <div className="hidden h-2.5 w-2.5 rounded-full bg-[#ff5f57] sm:block" />
          <div className="hidden h-2.5 w-2.5 rounded-full bg-[#febc2e] sm:block" />
          <div className="hidden h-2.5 w-2.5 rounded-full bg-[#28c840] sm:block" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-[0.24em]">
            Live Example
          </span>
          <button
            type="button"
            onClick={onCopy}
            aria-label={copied ? "Copied code" : "Copy code"}
            className="border-border bg-secondary/40 text-muted-foreground hover:border-accent/20 hover:bg-accent/10 hover:text-foreground focus-visible:ring-ring focus-visible:ring-offset-background inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            <span className="relative h-3.5 w-3.5">
              <Copy
                aria-hidden="true"
                className={cn(
                  "absolute inset-0 h-3.5 w-3.5 transition-opacity duration-200",
                  copied ? "opacity-0" : "opacity-100",
                )}
              />
              <Check
                aria-hidden="true"
                className={cn(
                  "absolute inset-0 h-3.5 w-3.5 transition-opacity duration-200",
                  copied ? "opacity-100" : "opacity-0",
                )}
              />
            </span>
          </button>
        </div>
      </div>

      <pre className="scrollbar-hide h-60 overflow-auto px-0 py-4 sm:h-72 sm:py-5">
        <code className="block min-w-max font-mono text-[10.5px] leading-5 sm:text-[13px] sm:leading-6">
          {lines.map((line, index) => (
            <div
              key={`${variant}-${index}-${line}`}
              className="grid grid-cols-[auto_1fr] gap-3 px-4 sm:gap-4 sm:px-5"
            >
              <span className="text-muted-foreground/40 select-none text-[10px] tabular-nums sm:text-[11px]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 whitespace-pre">
                <SyntaxHighlight code={line || " "} variant={variant} />
              </span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
