"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

/** Step 1: Dashboard mock interface */
export function CreateProjectVisual() {
  const [step, setStep] = useState(0);
  const [typedName, setTypedName] = useState("");
  const projectName = "my-app";

  useEffect(() => {
    const delays = [1500, 1200, 2000, 1200, 2500];
    const timeout = setTimeout(() => {
      setStep((prev) => {
        if (prev >= 4) {
          setTypedName("");
          return 0;
        }
        return prev + 1;
      });
    }, delays[step]);
    return () => clearTimeout(timeout);
  }, [step]);

  useEffect(() => {
    if (step === 2 && typedName.length < projectName.length) {
      const timeout = setTimeout(() => {
        setTypedName(projectName.slice(0, typedName.length + 1));
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [step, typedName]);

  const isFormStep = step === 2 || step === 3;
  const isReadyToSubmit = step === 3;
  const isSuccess = step === 4;

  return (
    <div className="bg-card flex h-full flex-col overflow-hidden rounded-lg border border-border/50 sm:rounded-xl">
      {/* Mac window header */}
      <div className="bg-muted/50 flex items-center justify-between border-b border-border/50 px-2 py-1 sm:px-4 sm:py-2">
        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-[#ff5f57] sm:h-2.5 sm:w-2.5" />
          <div className="h-1.5 w-1.5 rounded-full bg-[#febc2e] sm:h-2.5 sm:w-2.5" />
          <div className="h-1.5 w-1.5 rounded-full bg-[#28c840] sm:h-2.5 sm:w-2.5" />
          <span className="text-muted-foreground ml-1.5 hidden text-xs sm:inline">
            Dashboard
          </span>
        </div>

        {/* Add New button */}
        <div className="relative">
          <button
            className={cn(
              "flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium transition-all sm:gap-1.5 sm:rounded-lg sm:px-3 sm:py-1.5 sm:text-xs",
              step === 0
                ? "border border-accent bg-transparent text-accent ring-2 ring-accent/30"
                : "border border-accent bg-accent text-accent-foreground",
            )}
          >
            <span className="hidden sm:inline">Add New...</span>
            <span className="sm:hidden">Add</span>
            <span className="text-[7px] sm:text-[10px]">▼</span>
          </button>

          {/* Dropdown menu */}
          {step === 1 && (
            <div className="bg-popover absolute right-0 top-full z-10 mt-0.5 w-24 overflow-hidden rounded border border-border/50 py-0.5 shadow-xl sm:mt-1.5 sm:w-36 sm:rounded-lg sm:py-1.5">
              <div className="cursor-pointer bg-accent/20 px-2 py-1 text-[9px] font-medium text-accent sm:px-4 sm:py-2 sm:text-xs">
                New Project
              </div>
              <div className="text-muted-foreground hidden px-4 py-2 text-xs sm:block">
                Import from GitHub
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col p-2 sm:p-4">
        {(step === 0 || step === 1) && (
          <div className="flex h-full flex-col items-center justify-center">
            <div className="text-muted-foreground/50 text-[10px] sm:text-sm">
              {step === 0 ? 'Click "Add"' : 'Select "New Project"'}
            </div>
          </div>
        )}

        {isFormStep && (
          <div className="flex h-full flex-col justify-center space-y-1.5 sm:space-y-3">
            <div className="text-foreground text-[10px] font-semibold sm:text-sm">
              Create a new app
            </div>
            <div className="flex items-end gap-1.5 sm:gap-2">
              {/* App name input - simplified for mobile */}
              <div className="flex-1">
                <div className="text-muted-foreground mb-0.5 text-[8px] sm:mb-1.5 sm:text-xs">
                  Name
                </div>
                <div
                  className={cn(
                    "bg-muted/30 flex h-6 items-center rounded border px-1.5 transition-all sm:h-9 sm:rounded-lg sm:px-3",
                    isReadyToSubmit
                      ? "border-border/50"
                      : "border-accent/50 ring-2 ring-accent/20",
                  )}
                >
                  <span className="text-foreground text-[9px] sm:text-xs">
                    {typedName}
                    {!isReadyToSubmit && (
                      <span className="animate-pulse text-accent">|</span>
                    )}
                  </span>
                </div>
              </div>
              {/* Submit button */}
              <button
                className={cn(
                  "h-6 rounded px-2 text-[9px] font-medium transition-all sm:h-9 sm:rounded-lg sm:px-4 sm:text-xs",
                  isReadyToSubmit
                    ? "bg-accent text-accent-foreground ring-2 ring-accent/50"
                    : "bg-muted text-muted-foreground",
                )}
              >
                Create
              </button>
            </div>
          </div>
        )}

        {isSuccess && (
          <div className="flex h-full flex-col items-center justify-center gap-1 sm:gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 sm:h-12 sm:w-12">
              <Check className="h-4 w-4 text-emerald-600 dark:text-green-400 sm:h-6 sm:w-6" />
            </div>
            <div className="text-[10px] font-medium text-emerald-600 dark:text-green-400 sm:text-sm">
              Project Created!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
