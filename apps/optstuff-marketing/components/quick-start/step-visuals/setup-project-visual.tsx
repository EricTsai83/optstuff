"use client";

import { cn } from "@workspace/ui/lib/utils";
import { CheckCircle2, Copy, FolderOpen, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { MiniDashboardHeader } from "./mini-dashboard-header";

/** Classic mouse pointer SVG */
function FakeCursor({
  isClicking,
  className,
}: {
  readonly isClicking: boolean;
  readonly className?: string;
}) {
  return (
    <svg
      viewBox="0 0 14 18"
      fill="none"
      className={cn(
        "h-3.5 w-3 drop-shadow-md transition-transform duration-100 sm:h-[18px] sm:w-[14px]",
        isClicking && "scale-75",
        className,
      )}
    >
      <path
        d="M1 1L1 13L3.8 10.2L6.4 16L8.2 15L5.6 9.2L10 9.2L1 1Z"
        fill="white"
        stroke="black"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Step 2: Click "Create Project" → "Project Created" dialog with sk & pk keys */
export function SetupProjectVisual() {
  const [step, setStep] = useState(0);
  const [isClicking, setIsClicking] = useState(false);
  const prevStepRef = useRef(0);

  const secretKey = "sk_test_example_abcc123";
  const publishableKey = "pk_test_example_abc123";

  // Animation loop:
  // step 0: dashboard with cursor on "Create Project" button (1.5s)
  // step 1: dialog visible with keys (3.5s)
  // step 2: brief pause before reset (0.8s)
  useEffect(() => {
    const delays = [1500, 3500, 800];
    const timeout = setTimeout(() => {
      setStep((prev) => (prev >= 2 ? 0 : prev + 1));
    }, delays[step]);
    return () => clearTimeout(timeout);
  }, [step]);

  // Click animation when transitioning from step 0 → 1
  useEffect(() => {
    const prev = prevStepRef.current;
    prevStepRef.current = step;

    if (prev === 0 && step === 1) {
      setIsClicking(true);
      const timeout = setTimeout(() => setIsClicking(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [step]);

  const showCursor = step === 0 || isClicking;
  const isDialogOpen = step >= 1;

  return (
    <div className="bg-card border-border/50 flex h-full flex-col overflow-hidden rounded-lg border sm:rounded-xl">
      {/* Dashboard header */}
      <MiniDashboardHeader />

      {/* Main content area */}
      <div className="relative flex flex-1 flex-col">
        {/* Background: dashboard with project list */}
        <div className="flex flex-1 flex-col p-2 sm:p-3">
          {/* Search toolbar with Create Project button */}
          <div className="mb-1.5 flex items-center gap-2 sm:mb-2">
            <div className="border-border bg-background relative flex h-4 flex-1 items-center rounded border pl-4 sm:h-5 sm:pl-5">
              <Search className="text-muted-foreground/50 absolute left-1 h-2 w-2 sm:left-1.5 sm:h-2.5 sm:w-2.5" />
              <span className="text-muted-foreground/40 text-[7px] sm:text-[8px]">
                Search projects...
              </span>
            </div>

            {/* Button wrapper — cursor is anchored here */}
            <div className="relative shrink-0">
              <button
                className={cn(
                  "rounded px-1.5 py-0.5 text-[7px] font-medium transition-all sm:rounded-md sm:px-2 sm:py-0.5 sm:text-[9px]",
                  step === 0
                    ? "bg-primary text-primary-foreground ring-ring/30 ring-2"
                    : "bg-primary text-primary-foreground",
                )}
              >
                Create Project
              </button>

              {/* Fake cursor */}
              {showCursor && (
                <div className="pointer-events-none absolute top-1/2 left-1/2 z-20">
                  <FakeCursor isClicking={isClicking} />
                  {isClicking && (
                    <span className="bg-foreground/15 absolute -top-1.5 -left-1.5 h-4 w-4 animate-ping rounded-full" />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mini project cards */}
          <div className="space-y-1 sm:space-y-1.5">
            <div className="border-border/50 flex items-center gap-1.5 rounded-md border p-1 sm:gap-2 sm:rounded-lg sm:p-1.5">
              <FolderOpen className="text-muted-foreground h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3" />
              <span className="text-foreground text-[7px] font-medium sm:text-[9px]">
                my-website
              </span>
              <span className="text-muted-foreground ml-auto text-[6px] sm:text-[8px]">
                3 keys
              </span>
            </div>
            <div className="border-border/50 flex items-center gap-1.5 rounded-md border p-1 sm:gap-2 sm:rounded-lg sm:p-1.5">
              <FolderOpen className="text-muted-foreground h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3" />
              <span className="text-foreground text-[7px] font-medium sm:text-[9px]">
                blog-images
              </span>
              <span className="text-muted-foreground ml-auto text-[6px] sm:text-[8px]">
                1 key
              </span>
            </div>
          </div>
        </div>

        {/* Dialog overlay — "Project Created" with sk & pk keys */}
        {isDialogOpen && (
          <>
            {/* Backdrop */}
            <div className="bg-background/60 absolute inset-0 backdrop-blur-[1px]" />

            {/* Dialog panel */}
            <div className="absolute inset-x-2 top-1/2 z-10 -translate-y-1/2 sm:inset-x-4">
              <div className="bg-background border-border animate-in fade-in zoom-in-95 rounded-lg border p-2 shadow-lg duration-200 sm:rounded-xl sm:p-3">
                {/* Dialog header with success icon */}
                <div className="mb-1.5 flex items-center gap-1.5 sm:mb-2 sm:gap-2">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/10 sm:h-6 sm:w-6">
                    <CheckCircle2 className="h-3 w-3 text-green-500 sm:h-3.5 sm:w-3.5" />
                  </div>
                  <div>
                    <div className="text-foreground text-[9px] font-semibold sm:text-xs">
                      Project Created!
                    </div>
                    <div className="text-muted-foreground text-[6px] sm:text-[8px]">
                      Here are your API keys for{" "}
                      <span className="text-foreground font-medium">
                        My App
                      </span>
                    </div>
                  </div>
                </div>

                {/* Key rows */}
                <div className="space-y-1 sm:space-y-1.5">
                  {/* Secret Key */}
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <div className="text-muted-foreground w-10 shrink-0 text-[6px] font-medium sm:w-14 sm:text-[8px]">
                      Secret Key
                    </div>
                    <code className="border-border/50 bg-muted/50 text-foreground min-w-0 flex-1 truncate rounded border px-1 py-0.5 font-mono text-[7px] sm:rounded-md sm:px-1.5 sm:text-[9px]">
                      {secretKey}
                    </code>
                    <Copy className="text-muted-foreground h-2.5 w-2.5 shrink-0 cursor-pointer sm:h-3 sm:w-3" />
                  </div>

                  {/* Publishable Key */}
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <div className="text-muted-foreground w-10 shrink-0 text-[6px] font-medium sm:w-14 sm:text-[8px]">
                      Public Key
                    </div>
                    <code className="border-border/50 bg-muted/50 text-foreground min-w-0 flex-1 truncate rounded border px-1 py-0.5 font-mono text-[7px] sm:rounded-md sm:px-1.5 sm:text-[9px]">
                      {publishableKey}
                    </code>
                    <Copy className="text-muted-foreground h-2.5 w-2.5 shrink-0 cursor-pointer sm:h-3 sm:w-3" />
                  </div>
                </div>

                {/* Dialog footer */}
                <div className="mt-1.5 flex justify-end sm:mt-2">
                  <div className="bg-primary text-primary-foreground rounded px-1.5 py-0.5 text-[7px] font-medium sm:rounded-md sm:px-2 sm:text-[9px]">
                    Done
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
