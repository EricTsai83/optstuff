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
    <div className="bg-[#0a1120]">
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-300/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/55" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-[0.24em] text-sky-100/50">
            Live Example
          </span>
          <button
            type="button"
            onClick={onCopy}
            aria-label={copied ? "Copied code" : "Copy code"}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/4 text-white/72 transition-colors hover:border-emerald-200/18 hover:bg-emerald-300/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1120]"
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
              <span className="select-none text-[10px] tabular-nums text-white/22 sm:text-[11px]">
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
