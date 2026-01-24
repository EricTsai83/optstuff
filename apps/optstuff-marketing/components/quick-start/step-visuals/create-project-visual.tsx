"use client";

import { cn } from "@workspace/ui/lib/utils";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";

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
    <div className="bg-card border-border/50 flex h-full flex-col overflow-hidden rounded-lg border sm:rounded-xl">
      {/* Mac window header */}
      <div className="bg-muted/50 border-border/50 flex items-center justify-between border-b px-2 py-1 sm:px-4 sm:py-2">
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
                ? "border-accent text-accent ring-accent/30 border bg-transparent ring-2"
                : "border-accent bg-accent text-accent-foreground border",
            )}
          >
            <span className="hidden sm:inline">Add New...</span>
            <span className="sm:hidden">Add</span>
            <span className="text-[7px] sm:text-[10px]">▼</span>
          </button>

          {/* Dropdown menu */}
          {step === 1 && (
            <div className="bg-popover border-border/50 absolute top-full right-0 z-10 mt-0.5 w-24 overflow-hidden rounded border py-0.5 shadow-xl sm:mt-1.5 sm:w-36 sm:rounded-lg sm:py-1.5">
              <div className="bg-accent/20 text-accent cursor-pointer px-2 py-1 text-[9px] font-medium sm:px-4 sm:py-2 sm:text-xs">
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
                      : "border-accent/50 ring-accent/20 ring-2",
                  )}
                >
                  <span className="text-foreground text-[9px] sm:text-xs">
                    {typedName}
                    {!isReadyToSubmit && (
                      <span className="text-accent animate-pulse">|</span>
                    )}
                  </span>
                </div>
              </div>
              {/* Submit button */}
              <button
                className={cn(
                  "h-6 rounded px-2 text-[9px] font-medium transition-all sm:h-9 sm:rounded-lg sm:px-4 sm:text-xs",
                  isReadyToSubmit
                    ? "bg-accent text-accent-foreground ring-accent/50 ring-2"
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
              <Check className="h-4 w-4 text-emerald-600 sm:h-6 sm:w-6 dark:text-green-400" />
            </div>
            <div className="text-[10px] font-medium text-emerald-600 sm:text-sm dark:text-green-400">
              Project Created!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
