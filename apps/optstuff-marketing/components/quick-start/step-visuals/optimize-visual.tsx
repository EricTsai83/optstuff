"use client";

import { cn } from "@workspace/ui/lib/utils";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";

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
              dur="1.1s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="cy"
              values="6;6"
              dur="1.1s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0;0.4;0.4;0"
              dur="1.1s"
              repeatCount="indefinite"
            />
          </circle>
          {/* Core dot */}
          <circle r="3" fill={color}>
            <animate
              attributeName="cx"
              values="0;24"
              dur="1.1s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="cy"
              values="6;6"
              dur="1.1s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              dur="1.1s"
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
              dur="1.1s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="cy"
              values="6;6"
              dur="1.1s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0;0.4;0.4;0"
              dur="1.1s"
              repeatCount="indefinite"
            />
          </circle>
          {/* Core dot */}
          <circle r="3" fill={color}>
            <animate
              attributeName="cx"
              values="32;8"
              dur="1.1s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="cy"
              values="6;6"
              dur="1.1s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              dur="1.1s"
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
    const delays = [1800, 1500, 2200, 1500, 3200];
    const timeout = setTimeout(() => {
      setStep((prev) => (prev >= 4 ? 0 : prev + 1));
    }, delays[step]);
    return () => clearTimeout(timeout);
  }, [step]);

  const isSigningActive = step === 1;
  const isOptStuffActive = step === 2;
  const isRequestArrowActive = step === 1;
  const isResponseArrowActive = step === 3;
  const isShowingResult = step === 4;

  return (
    <div className="flex h-full flex-row items-stretch gap-2 sm:gap-3">
      {/* Left: App server signs the URL */}
      <div className="border-border/50 bg-card flex flex-[1.2] flex-col overflow-hidden rounded-lg border sm:flex-[1.5] sm:rounded-xl">
        {/* Mac window header */}
        <div className="border-border/50 bg-muted/50 flex items-center justify-center gap-1 border-b px-2 py-1.5 sm:justify-start sm:gap-1.5 sm:px-4 sm:py-2">
          <div className="hidden h-2.5 w-2.5 rounded-full bg-[#ff5f57] sm:block" />
          <div className="hidden h-2.5 w-2.5 rounded-full bg-[#febc2e] sm:block" />
          <div className="hidden h-2.5 w-2.5 rounded-full bg-[#28c840] sm:block" />
          <span className="text-muted-foreground text-xs font-medium sm:ml-2">
            app.yoursite.com
          </span>
        </div>

        {/* Signing flow */}
        <div className="flex-1 p-2 sm:p-3">
          <div
            className={cn(
              "flex h-full flex-col items-center justify-center overflow-hidden rounded-md border px-2 py-1.5 font-mono transition-all duration-300 sm:rounded-lg sm:px-4 sm:py-3",
              isSigningActive
                ? "border-accent/40 bg-accent/5"
                : isShowingResult
                  ? "border-green-500/40 bg-green-500/5"
                  : "border-border/50 bg-muted/30",
            )}
          >
            {!isShowingResult && (
              <div className="flex w-full max-w-60 flex-col gap-2 text-[10px] leading-relaxed sm:max-w-[18rem] sm:text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground uppercase tracking-[0.18em]">
                    server
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[9px] font-semibold transition-colors sm:text-[10px]",
                      isSigningActive
                        ? "bg-accent/15 text-accent"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    sk_... stays private
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="border-border/50 bg-background/70 rounded-md border px-2 py-1.5">
                    <span className="text-muted-foreground">const src = </span>
                    <span className="text-foreground">
                      &quot;cdn.example.com/hero.jpg&quot;
                    </span>
                  </div>

                  <div
                    className={cn(
                      "rounded-md border px-2 py-1.5 transition-colors duration-300",
                      isSigningActive
                        ? "border-accent/40 bg-accent/10"
                        : "border-border/50 bg-background/70",
                    )}
                  >
                    <span className="text-muted-foreground">
                      const signed ={" "}
                    </span>
                    <span className="text-accent">signImageUrl(src)</span>
                  </div>

                  <div className="border-border/50 bg-background/70 rounded-md border px-2 py-1.5">
                    <span className="text-purple-500 dark:text-purple-400">
                      {`<img`}
                    </span>{" "}
                    <span className="text-muted-foreground">src=</span>
                    <span className="text-foreground">&quot;signed&quot;</span>
                    <span className="text-purple-500 dark:text-purple-400">
                      {" />"}
                    </span>
                  </div>
                </div>

                <div
                  className={cn(
                    "truncate rounded-md border px-2 py-1.5 text-[9px] transition-colors duration-300 sm:text-[10px]",
                    isSigningActive
                      ? "border-accent/40 bg-accent/10 text-accent"
                      : "border-border/50 bg-background/60 text-muted-foreground",
                  )}
                >
                  /api/v1/... ?key=pk_...&sig=...
                </div>
              </div>
            )}

            {isShowingResult && (
              <div className="flex flex-col items-center gap-2 text-center sm:gap-3">
                <div className="flex size-14 items-center justify-center rounded-lg bg-green-500/20">
                  <span className="text-2xl sm:text-3xl">🖼️</span>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-emerald-600 sm:text-base dark:text-green-400">
                    Browser receives optimized bytes
                  </div>
                  <div className="text-muted-foreground text-[10px] sm:text-xs">
                    Same URL contract, smaller payload.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Middle: Arrows - always horizontal */}
      <div className="flex flex-col items-center justify-center gap-2 px-1 sm:gap-3 sm:px-2">
        {/* Request arrow (App server → OptStuff) - uses accent color */}
        <ArrowRight active={isRequestArrowActive} color="hsl(160, 84%, 39%)" />

        {/* Response arrow (OptStuff → browser) - uses green */}
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
              <div className="animate-soft-pulse bg-accent/40 absolute inset-0 rounded-xl sm:rounded-2xl" />
            )}

            <div className="relative">
              {isOptStuffActive ? (
                <span className="text-xl sm:text-3xl">⚡</span>
              ) : step >= 3 ? (
                <Check className="h-6 w-6 text-emerald-600 sm:h-8 sm:w-8 dark:text-green-400" />
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
