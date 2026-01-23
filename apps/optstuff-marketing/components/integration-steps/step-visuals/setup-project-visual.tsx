"use client";

import { cn } from "@workspace/ui/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";

/** Step 2: API Key list */
export function SetupProjectVisual() {
  const [step, setStep] = useState(0);
  const apiKey = "sk_live_a1b2...";
  const maskedKey = "sk_live_****";

  useEffect(() => {
    const delays = [1500, 1200, 3000];
    const timeout = setTimeout(() => {
      setStep((prev) => (prev >= 2 ? 0 : prev + 1));
    }, delays[step]);
    return () => clearTimeout(timeout);
  }, [step]);

  const isEyeHighlighted = step === 1;
  const isRevealed = step === 2;

  return (
    <div className="bg-card border-border/50 flex h-full flex-col overflow-hidden rounded-lg border sm:rounded-xl">
      {/* Mac window header */}
      <div className="bg-muted/50 border-border/50 flex items-center gap-1 border-b px-2 py-1 sm:gap-1.5 sm:px-4 sm:py-2">
        <div className="h-1.5 w-1.5 rounded-full bg-[#ff5f57] sm:h-2.5 sm:w-2.5" />
        <div className="h-1.5 w-1.5 rounded-full bg-[#febc2e] sm:h-2.5 sm:w-2.5" />
        <div className="h-1.5 w-1.5 rounded-full bg-[#28c840] sm:h-2.5 sm:w-2.5" />
        <span className="text-muted-foreground ml-1 text-[8px] sm:ml-2 sm:text-xs">
          API Keys
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-center p-2 sm:p-4">
        <div className="mb-1.5 sm:mb-3">
          <div className="text-foreground text-[10px] font-semibold sm:text-sm">
            Standard Keys
          </div>
        </div>

        {/* Key row */}
        <div className="bg-muted/30 border-border/50 flex items-center gap-1.5 rounded border px-2 py-1.5 sm:gap-3 sm:rounded-lg sm:px-4 sm:py-3">
          <div className="text-foreground/70 shrink-0 text-[8px] sm:text-xs">
            Secret
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
            <code
              className={cn(
                "min-w-0 flex-1 truncate rounded border px-1.5 py-0.5 font-mono text-[8px] transition-all duration-300 sm:rounded-lg sm:px-3 sm:py-1.5 sm:text-xs",
                isRevealed
                  ? "border-accent/30 bg-accent/10 text-accent"
                  : "border-border/50 bg-muted/50 text-muted-foreground",
              )}
            >
              {isRevealed ? apiKey : maskedKey}
            </code>
            <button
              className={cn(
                "shrink-0 rounded p-0.5 transition-all duration-300 sm:rounded-lg sm:p-1.5",
                isEyeHighlighted
                  ? "bg-accent/20 text-accent ring-accent/40 ring-2"
                  : isRevealed
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:text-foreground",
              )}
              aria-label={isRevealed ? "Hide API key" : "Show API key"}
            >
              {isRevealed ? (
                <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
              ) : (
                <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
