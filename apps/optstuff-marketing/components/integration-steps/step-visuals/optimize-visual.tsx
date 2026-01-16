"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

/** Simple arrow SVG pointing right */
function ArrowRight({ active, color }: { active: boolean; color: string }) {
  return (
    <svg
      width="32"
      height="12"
      viewBox="0 0 32 12"
      fill="none"
      className="h-4 w-10 sm:h-5 sm:w-12"
    >
      <line
        x1="0"
        y1="6"
        x2="24"
        y2="6"
        stroke={active ? color : "#666"}
        strokeWidth="2"
        strokeOpacity={active ? 1 : 0.3}
      />
      <path
        d="M22 2L28 6L22 10"
        stroke={active ? color : "#666"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity={active ? 1 : 0.3}
        fill="none"
      />
      {/* Animated glowing dot */}
      {active && (
        <>
          {/* Glow effect */}
          <circle r="5" fill={color} opacity="0.4">
            <animate
              attributeName="cx"
              values="0;24"
              dur="0.8s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="cy"
              values="6;6"
              dur="0.8s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0;0.4;0.4;0"
              dur="0.8s"
              repeatCount="indefinite"
            />
          </circle>
          {/* Core dot */}
          <circle r="3" fill={color}>
            <animate
              attributeName="cx"
              values="0;24"
              dur="0.8s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="cy"
              values="6;6"
              dur="0.8s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              dur="0.8s"
              repeatCount="indefinite"
            />
          </circle>
        </>
      )}
    </svg>
  );
}

/** Simple arrow SVG pointing left */
function ArrowLeft({ active, color }: { active: boolean; color: string }) {
  return (
    <svg
      width="32"
      height="12"
      viewBox="0 0 32 12"
      fill="none"
      className="h-4 w-10 sm:h-5 sm:w-12"
    >
      <line
        x1="8"
        y1="6"
        x2="32"
        y2="6"
        stroke={active ? color : "#666"}
        strokeWidth="2"
        strokeOpacity={active ? 1 : 0.3}
      />
      <path
        d="M10 2L4 6L10 10"
        stroke={active ? color : "#666"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity={active ? 1 : 0.3}
        fill="none"
      />
      {/* Animated glowing dot */}
      {active && (
        <>
          {/* Glow effect */}
          <circle r="5" fill={color} opacity="0.4">
            <animate
              attributeName="cx"
              values="32;8"
              dur="0.8s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="cy"
              values="6;6"
              dur="0.8s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0;0.4;0.4;0"
              dur="0.8s"
              repeatCount="indefinite"
            />
          </circle>
          {/* Core dot */}
          <circle r="3" fill={color}>
            <animate
              attributeName="cx"
              values="32;8"
              dur="0.8s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="cy"
              values="6;6"
              dur="0.8s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              dur="0.8s"
              repeatCount="indefinite"
            />
          </circle>
        </>
      )}
    </svg>
  );
}

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
    <div className="flex h-full flex-row items-stretch gap-2 sm:gap-3">
      {/* Left: Website */}
      <div className="flex flex-[1.2] flex-col overflow-hidden rounded-lg border border-border/50 bg-card sm:flex-[1.5] sm:rounded-xl">
        {/* Mac window header */}
        <div className="flex items-center justify-center gap-1 border-b border-border/50 bg-muted/50 px-2 py-1.5 sm:justify-start sm:gap-1.5 sm:px-4 sm:py-2">
          <div className="hidden h-2.5 w-2.5 rounded-full bg-[#ff5f57] sm:block" />
          <div className="hidden h-2.5 w-2.5 rounded-full bg-[#febc2e] sm:block" />
          <div className="hidden h-2.5 w-2.5 rounded-full bg-[#28c840] sm:block" />
          <span className="text-muted-foreground text-xs font-medium sm:ml-2">
            yoursite.com
          </span>
        </div>

        {/* Code view */}
        <div className="flex-1 p-2 sm:p-3">
          <div
            className={cn(
              "flex h-full flex-col items-center justify-center overflow-hidden rounded-md border px-2 py-1.5 font-mono transition-all duration-300 sm:rounded-lg sm:px-4 sm:py-3",
              isWebsiteActive
                ? "border-accent/40 bg-accent/5"
                : isWebsiteShowingResult
                  ? "border-green-500/40 bg-green-500/5"
                  : "border-border/50 bg-muted/30",
            )}
          >
            {!isWebsiteShowingResult && (
              <div className="flex flex-wrap items-center justify-center text-sm leading-relaxed sm:text-base">
                <span className="text-purple-500 dark:text-purple-400">
                  {`<img`}
                </span>
                {"\u00A0"}
                <span className="text-muted-foreground">{"src="}</span>
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
              <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:gap-3">
                <div className="flex size-14 items-center justify-center rounded-lg bg-green-500/20">
                  <span className="text-2xl sm:text-3xl">🖼️</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Middle: Arrows - always horizontal */}
      <div className="flex flex-col items-center justify-center gap-2 px-1 sm:gap-3 sm:px-2">
        {/* Request arrow (Website → OptStuff) - uses accent color */}
        <ArrowRight active={isRequestArrowActive} color="hsl(160, 84%, 39%)" />

        {/* Response arrow (OptStuff → Website) - uses green */}
        <ArrowLeft active={isResponseArrowActive} color="rgb(16, 185, 129)" />
      </div>

      {/* Right: OptStuff Server */}
      <div
        className={cn(
          "bg-card relative flex flex-1 flex-col items-center justify-center gap-1.5 overflow-hidden rounded-lg border p-2 transition-all duration-300 sm:gap-3 sm:rounded-xl sm:p-4",
          isOptStuffActive
            ? "border-accent/50"
            : step >= 3
              ? "border-green-500/40"
              : "border-border/50",
        )}
      >
        <div className="relative flex flex-col items-center gap-1.5 sm:gap-3">
          <div
            className={cn(
              "relative flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 sm:h-16 sm:w-16 sm:rounded-2xl",
              isOptStuffActive
                ? "bg-accent/20"
                : step >= 3
                  ? "bg-green-500/20"
                  : "bg-muted/50",
            )}
          >
            {isOptStuffActive && (
              <div className="animate-soft-pulse absolute inset-0 rounded-xl bg-accent/40 sm:rounded-2xl" />
            )}

            <div className="relative">
              {isOptStuffActive ? (
                <span className="text-xl sm:text-3xl">⚡</span>
              ) : step >= 3 ? (
                <Check className="h-6 w-6 text-emerald-600 dark:text-green-400 sm:h-8 sm:w-8" />
              ) : (
                <span className="text-xl sm:text-3xl">📦</span>
              )}
            </div>
          </div>

          <div
            className={cn(
              "text-sm font-bold transition-colors duration-300 sm:text-base",
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
