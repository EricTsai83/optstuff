"use client";

import { useEffect, useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

/** Step 3: Realtime optimization flow visualization */
export function OptimizeVisual() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const delays = [1200, 1000, 1500, 1000, 2500];
    const timeout = setTimeout(() => {
      setStep((prev) => (prev >= 4 ? 0 : prev + 1));
    }, delays[step]);
    return () => clearTimeout(timeout);
  }, [step]);

  const isWebsiteActive = step === 1 || step === 4;
  const isOptStuffActive = step === 2;
  const isRequestArrowActive = step === 1;
  const isResponseArrowActive = step === 3;
  const isWebsiteShowingResult = step === 4;

  return (
    <div className="flex h-full flex-row items-stretch gap-1.5 sm:gap-3">
      {/* Left: Website */}
      <div className="flex flex-[1.2] flex-col overflow-hidden rounded-lg border border-border/50 bg-card sm:flex-[1.5] sm:rounded-xl">
        {/* Mac window header */}
        <div className="flex items-center gap-1 border-b border-border/50 bg-muted/50 px-2 py-1 sm:gap-1.5 sm:px-4 sm:py-2">
          <div className="h-1.5 w-1.5 rounded-full bg-[#ff5f57] sm:h-2.5 sm:w-2.5" />
          <div className="h-1.5 w-1.5 rounded-full bg-[#febc2e] sm:h-2.5 sm:w-2.5" />
          <div className="h-1.5 w-1.5 rounded-full bg-[#28c840] sm:h-2.5 sm:w-2.5" />
          <span className="text-muted-foreground ml-1 text-[8px] sm:ml-2 sm:text-xs">
            yoursite.com
          </span>
        </div>

        {/* Code view */}
        <div className="flex-1 p-1.5 sm:p-3">
          <div
            className={cn(
              "flex h-full flex-col justify-center overflow-hidden rounded-md border px-1.5 py-1 font-mono transition-all duration-300 sm:rounded-lg sm:px-4 sm:py-3",
              isWebsiteActive
                ? "border-accent/40 bg-accent/5"
                : isWebsiteShowingResult
                  ? "border-green-500/40 bg-green-500/5"
                  : "border-border/50 bg-muted/30",
            )}
          >
            {!isWebsiteShowingResult && (
              <div className="flex flex-wrap items-center text-[8px] leading-relaxed sm:text-xs">
                <span className="text-purple-500 dark:text-purple-400">
                  &lt;img
                </span>
                <span className="text-muted-foreground">{" src="}</span>
                <span
                  className={cn(
                    "transition-colors duration-300",
                    isWebsiteActive
                      ? "text-accent"
                      : "text-emerald-600 dark:text-green-400",
                  )}
                >
                  &quot;...&quot;
                </span>
                <span className="text-purple-500 dark:text-purple-400">
                  /&gt;
                </span>
              </div>
            )}

            {isWebsiteShowingResult && (
              <div className="flex items-center gap-1.5 sm:gap-3">
                <div className="flex h-6 w-7 items-center justify-center rounded bg-green-500/20 sm:h-10 sm:w-12 sm:rounded-lg">
                  <span className="text-xs sm:text-lg">🖼️</span>
                </div>
                <div>
                  <div className="text-[8px] font-medium text-emerald-600 dark:text-green-400 sm:text-sm">
                    hero.webp
                  </div>
                  <div className="text-muted-foreground text-[7px] sm:text-xs">
                    92% smaller
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Middle: Arrows - always horizontal */}
      <div className="relative flex flex-col items-center justify-center gap-1 px-0.5 sm:gap-3 sm:px-3">
        {/* Request arrow */}
        <div className="relative flex items-center">
          <div
            className={cn(
              "h-0.5 w-2 transition-all duration-300 sm:w-4",
              isRequestArrowActive ? "bg-accent" : "bg-muted-foreground/30",
            )}
          />
          <ArrowRight
            className={cn(
              "-ml-0.5 h-3 w-3 transition-all duration-300 sm:h-4 sm:w-4",
              isRequestArrowActive ? "text-accent" : "text-muted-foreground/30",
            )}
          />
        </div>

        {/* Response arrow */}
        <div className="relative flex items-center">
          <ArrowRight
            className={cn(
              "-mr-0.5 h-3 w-3 rotate-180 transition-all duration-300 sm:h-4 sm:w-4",
              isResponseArrowActive
                ? "text-emerald-600 dark:text-green-400"
                : "text-muted-foreground/30",
            )}
          />
          <div
            className={cn(
              "h-0.5 w-2 transition-all duration-300 sm:w-4",
              isResponseArrowActive
                ? "bg-emerald-500"
                : "bg-muted-foreground/30",
            )}
          />
        </div>
      </div>

      {/* Right: OptStuff Server */}
      <div
        className={cn(
          "bg-card relative flex flex-1 flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border p-2 transition-all duration-300 sm:gap-3 sm:rounded-xl sm:p-4",
          isOptStuffActive
            ? "border-accent/50"
            : step >= 3
              ? "border-green-500/40"
              : "border-border/50",
        )}
      >
        <div className="relative flex flex-col items-center gap-0.5 sm:gap-2">
          <div
            className={cn(
              "relative flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300 sm:h-14 sm:w-14 sm:rounded-2xl",
              isOptStuffActive
                ? "bg-accent/20"
                : step >= 3
                  ? "bg-green-500/20"
                  : "bg-muted/50",
            )}
          >
            {isOptStuffActive && (
              <div className="animate-soft-pulse absolute inset-0 rounded-lg bg-accent/40 sm:rounded-2xl" />
            )}

            <div className="relative">
              {isOptStuffActive ? (
                <span className="text-base sm:text-2xl">⚡</span>
              ) : step >= 3 ? (
                <Check className="h-4 w-4 text-emerald-600 dark:text-green-400 sm:h-7 sm:w-7" />
              ) : (
                <span className="text-base sm:text-2xl">📦</span>
              )}
            </div>
          </div>

          <div
            className={cn(
              "text-[9px] font-bold transition-colors duration-300 sm:text-sm",
              isOptStuffActive
                ? "text-accent"
                : step >= 3
                  ? "text-emerald-600 dark:text-green-400"
                  : "text-muted-foreground",
            )}
          >
            OptStuff
          </div>
        </div>
      </div>
    </div>
  );
}
