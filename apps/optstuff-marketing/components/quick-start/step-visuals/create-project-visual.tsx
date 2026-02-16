"use client";

import { cn } from "@workspace/ui/lib/utils";
import {
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  FolderOpen,
  Search,
} from "lucide-react";
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

/**
 * Combined animation: Create project → type name → submit →
 * "Project Created!" dialog with sk (hidden) & pk (visible) →
 * cursor clicks eye icon to reveal sk → cursor clicks copy
 */
export function CreateProjectVisual() {
  const [step, setStep] = useState(0);
  const [typedName, setTypedName] = useState("");
  const [isClicking, setIsClicking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClickingEye, setIsClickingEye] = useState(false);
  const [isClickingCopy, setIsClickingCopy] = useState(false);
  const [skVisible, setSkVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const prevStepRef = useRef(0);
  const isFirstRenderRef = useRef(true);

  const projectName = "My App";
  const secretKey = "sk_live_yc8XjqSwYTiu4K3k";
  const maskedSecretKey = "sk_live_••••••••••••••••••";
  const publishableKey = "pk_live_a7Bm2UtfKlV9R1w";

  // Animation loop:
  // step 0: dashboard idle (2s first render for DOM entrance, 1.5s on loops)
  // step 1: cursor on "New Project" button (1.5s)
  // step 2: click → dialog open, typing begins (2s)
  // step 3: name typed, cursor on "Create Project" submit (1.2s)
  // step 4: click → "Project Created!" dialog with sk(hidden)/pk(visible) (1.5s)
  // step 5: cursor on eye icon (1s)
  // step 6: click eye → SK revealed (1.2s)
  // step 7: cursor on copy button (1s)
  // step 8: click copy → "Copied!" feedback (2.5s, then reset)
  useEffect(() => {
    const initialDelay = isFirstRenderRef.current ? 2000 : 1500;
    const delays = [initialDelay, 1500, 2000, 1200, 1500, 1000, 1200, 1000, 2500];

    const timeout = setTimeout(() => {
      setStep((prev) => {
        if (prev >= 8) {
          setTypedName("");
          setSkVisible(false);
          setIsCopied(false);
          isFirstRenderRef.current = false;
          return 0;
        }
        return prev + 1;
      });
    }, delays[step]);

    return () => clearTimeout(timeout);
  }, [step]);

  // Typing animation during step 2
  useEffect(() => {
    if (step === 2 && typedName.length < projectName.length) {
      const timeout = setTimeout(() => {
        setTypedName(projectName.slice(0, typedName.length + 1));
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [step, typedName]);

  // Click animations for all interactive elements
  useEffect(() => {
    const prev = prevStepRef.current;
    prevStepRef.current = step;

    // Click "New Project" button (step 1 → 2)
    if (prev === 1 && step === 2) {
      setIsClicking(true);
      const timeout = setTimeout(() => setIsClicking(false), 200);
      return () => clearTimeout(timeout);
    }

    // Click "Create Project" submit button (step 3 → 4)
    if (prev === 3 && step === 4) {
      setIsSubmitting(true);
      const timeout = setTimeout(() => setIsSubmitting(false), 200);
      return () => clearTimeout(timeout);
    }

    // Click eye icon to reveal SK (step 5 → 6)
    if (prev === 5 && step === 6) {
      setIsClickingEye(true);
      setSkVisible(true);
      const timeout = setTimeout(() => setIsClickingEye(false), 200);
      return () => clearTimeout(timeout);
    }

    // Click copy button (step 7 → 8)
    if (prev === 7 && step === 8) {
      setIsClickingCopy(true);
      setIsCopied(true);
      const timeout = setTimeout(() => setIsClickingCopy(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [step]);

  const isDialogOpen = step >= 2 && step <= 3;
  const isTyping = step === 2;
  const isReadyToSubmit = step === 3;
  const isSuccess = step >= 4;
  const showNewProjectCursor = step === 1 || isClicking;
  const showSubmitCursor = step === 3 || isSubmitting;
  const showEyeCursor = step === 5 || isClickingEye;
  const showCopyCursor = step === 7 || isClickingCopy;

  return (
    <div className="bg-card border-border/50 flex h-full flex-col overflow-hidden rounded-lg border sm:rounded-xl">
      <MiniDashboardHeader />

      <div className="relative flex flex-1 flex-col">
        {/* Background: dashboard overview with toolbar + project list */}
        <div className="flex flex-1 flex-col p-2.5 sm:p-3.5">
          {/* Search toolbar with New Project button */}
          <div className="mb-2 flex items-center gap-2 sm:mb-2.5">
            <div className="border-border bg-background relative flex h-5 flex-1 items-center rounded border pl-5 sm:h-6 sm:rounded-md sm:pl-6">
              <Search className="text-muted-foreground/50 absolute left-1.5 h-2.5 w-2.5 sm:left-2 sm:h-3 sm:w-3" />
              <span className="text-muted-foreground/40 text-[8px] sm:text-[10px]">
                Search projects...
              </span>
            </div>

            {/* New Project button — focal element, larger */}
            <div className="relative shrink-0">
              <button
                className={cn(
                  "rounded-md px-2.5 py-1 text-[10px] font-semibold transition-all sm:rounded-lg sm:px-3.5 sm:py-1.5 sm:text-xs",
                  step === 1
                    ? "bg-primary text-primary-foreground ring-ring/30 ring-2"
                    : "bg-primary text-primary-foreground",
                )}
              >
                New Project
              </button>

              {/* Fake cursor on "New Project" button */}
              {showNewProjectCursor && (
                <div className="pointer-events-none absolute top-1/2 left-1/2 z-20">
                  <FakeCursor isClicking={isClicking} />
                  {isClicking && (
                    <span className="bg-foreground/15 absolute -top-1.5 -left-1.5 h-4 w-4 animate-ping rounded-full" />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mini project cards — background, keep modest */}
          <div className="space-y-1.5 sm:space-y-2">
            <div className="border-border/50 flex items-center gap-2 rounded-md border p-1.5 sm:gap-2.5 sm:rounded-lg sm:p-2">
              <FolderOpen className="text-muted-foreground h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
              <span className="text-foreground text-[8px] font-medium sm:text-[10px]">
                my-website
              </span>
              <span className="text-muted-foreground ml-auto text-[7px] sm:text-[9px]">
                3 keys
              </span>
            </div>
            <div className="border-border/50 flex items-center gap-2 rounded-md border p-1.5 sm:gap-2.5 sm:rounded-lg sm:p-2">
              <FolderOpen className="text-muted-foreground h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
              <span className="text-foreground text-[8px] font-medium sm:text-[10px]">
                blog-images
              </span>
              <span className="text-muted-foreground ml-auto text-[7px] sm:text-[9px]">
                1 key
              </span>
            </div>
          </div>
        </div>

        {/* Dialog overlay */}
        {(isDialogOpen || isSuccess) && (
          <>
            <div className="bg-background/60 absolute inset-0 backdrop-blur-[1px]" />

            <div className="absolute inset-x-2.5 top-1/2 z-10 -translate-y-1/2 sm:inset-x-4">
              <div className="bg-background border-border rounded-lg border p-3 shadow-lg sm:rounded-xl sm:p-4">
                {!isSuccess ? (
                  <>
                    {/* Create Project form dialog */}
                    <div className="mb-2.5 sm:mb-3">
                      {/* Dialog title — focal, large */}
                      <div className="text-foreground text-xs font-bold sm:text-base">
                        Create Project
                      </div>
                      <div className="text-muted-foreground text-[8px] sm:text-[10px]">
                        Create a new project to start optimizing.
                      </div>
                    </div>

                    <div className="space-y-2 sm:space-y-2.5">
                      {/* Project Name field */}
                      <div>
                        <div className="text-foreground mb-0.5 text-[9px] font-medium sm:text-[10px]">
                          Project Name
                        </div>
                        <div
                          className={cn(
                            "bg-background flex h-7 items-center rounded-md border px-2 transition-all sm:h-8 sm:px-2.5",
                            isTyping
                              ? "border-ring/50 ring-ring/20 ring-1"
                              : "border-border",
                          )}
                        >
                          {/* Typed name — focal, larger */}
                          <span className="text-[10px] sm:text-xs">
                            {typedName ? (
                              <span className="text-foreground font-medium">
                                {typedName}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/50">
                                My Awesome Project
                              </span>
                            )}
                            {isTyping && (
                              <span className="text-ring animate-pulse">
                                |
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Description field — only on larger screens */}
                      <div className="hidden sm:block">
                        <div className="text-foreground mb-0.5 text-[10px] font-medium">
                          Description{" "}
                          <span className="text-muted-foreground font-normal">
                            (optional)
                          </span>
                        </div>
                        <div className="bg-background border-border flex h-8 items-center rounded-md border px-2.5">
                          <span className="text-muted-foreground/50 text-xs">
                            A brief description...
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dialog footer — buttons are focal */}
                    <div className="mt-2.5 flex justify-end gap-1.5 sm:mt-3 sm:gap-2">
                      <div className="border-border text-foreground rounded-md border px-2.5 py-1 text-[10px] sm:px-3 sm:text-xs">
                        Cancel
                      </div>
                      <div className="relative">
                        <div
                          className={cn(
                            "rounded-md px-2.5 py-1 text-[10px] font-semibold transition-all sm:px-3 sm:text-xs",
                            isReadyToSubmit
                              ? "bg-primary text-primary-foreground ring-ring/50 ring-2"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          Create Project
                        </div>

                        {/* Fake cursor on "Create Project" submit button */}
                        {showSubmitCursor && (
                          <div className="pointer-events-none absolute top-1/2 left-3/4 z-20">
                            <FakeCursor isClicking={isSubmitting} />
                            {isSubmitting && (
                              <span className="bg-foreground/15 absolute -top-1.5 -left-1.5 h-4 w-4 animate-ping rounded-full" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  /* Success: "Project Created!" with sk (hidden) & pk (visible) */
                  <>
                    <div className="mb-2.5 flex items-center gap-2 sm:mb-3 sm:gap-2.5">
                      {/* Success icon — focal */}
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-500/10 sm:h-8 sm:w-8">
                        <CheckCircle2 className="h-4 w-4 text-green-500 sm:h-5 sm:w-5" />
                      </div>
                      <div>
                        {/* Success title — focal, large */}
                        <div className="text-foreground text-xs font-bold sm:text-base">
                          Project Created!
                        </div>
                        <div className="text-muted-foreground text-[8px] sm:text-[10px]">
                          Here are your API keys for{" "}
                          <span className="text-foreground font-medium">
                            My App
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Key rows — focal area */}
                    <div className="space-y-2 sm:space-y-2.5">
                      {/* Secret Key — hidden by default, eye icon to toggle */}
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="text-muted-foreground w-14 shrink-0 text-[8px] font-medium sm:w-[72px] sm:text-[10px]">
                          Secret Key
                        </div>
                        {/* SK value — focal, larger mono text */}
                        <code
                          className={cn(
                            "border-border/50 bg-muted/50 min-w-0 flex-1 truncate rounded-md border px-2 py-1 font-mono text-[10px] transition-colors duration-200 sm:px-2.5 sm:text-xs",
                            skVisible
                              ? "text-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          {skVisible ? secretKey : maskedSecretKey}
                        </code>

                        {/* Eye toggle — focal icon */}
                        <div className="relative shrink-0">
                          {skVisible ? (
                            <EyeOff className="text-muted-foreground h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          ) : (
                            <Eye
                              className={cn(
                                "h-3.5 w-3.5 sm:h-4 sm:w-4",
                                showEyeCursor
                                  ? "text-accent"
                                  : "text-muted-foreground",
                              )}
                            />
                          )}
                          {showEyeCursor && (
                            <div className="pointer-events-none absolute top-1/2 left-1/2 z-20">
                              <FakeCursor isClicking={isClickingEye} />
                              {isClickingEye && (
                                <span className="bg-foreground/15 absolute -top-1.5 -left-1.5 h-4 w-4 animate-ping rounded-full" />
                              )}
                            </div>
                          )}
                        </div>

                        {/* Copy button — focal icon */}
                        <div className="relative shrink-0">
                          {isCopied ? (
                            <Check className="h-3.5 w-3.5 text-green-500 sm:h-4 sm:w-4" />
                          ) : (
                            <Copy
                              className={cn(
                                "h-3.5 w-3.5 sm:h-4 sm:w-4",
                                showCopyCursor
                                  ? "text-accent"
                                  : "text-muted-foreground",
                              )}
                            />
                          )}
                          {isCopied && (
                            <span className="animate-in fade-in slide-in-from-bottom-1 text-green-500 absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-semibold duration-200 sm:text-[10px]">
                              Copied!
                            </span>
                          )}
                          {showCopyCursor && (
                            <div className="pointer-events-none absolute top-1/2 left-1/2 z-20">
                              <FakeCursor isClicking={isClickingCopy} />
                              {isClickingCopy && (
                                <span className="bg-foreground/15 absolute -top-1.5 -left-1.5 h-4 w-4 animate-ping rounded-full" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Public Key — always visible */}
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="text-muted-foreground w-14 shrink-0 text-[8px] font-medium sm:w-[72px] sm:text-[10px]">
                          Public Key
                        </div>
                        {/* PK value — focal, larger mono text */}
                        <code className="border-border/50 bg-muted/50 text-foreground min-w-0 flex-1 truncate rounded-md border px-2 py-1 font-mono text-[10px] sm:px-2.5 sm:text-xs">
                          {publishableKey}
                        </code>
                        <Copy className="text-muted-foreground h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                      </div>
                    </div>

                    <div className="mt-2.5 flex justify-end sm:mt-3">
                      {/* Done button — focal */}
                      <div className="bg-primary text-primary-foreground rounded-md px-2.5 py-1 text-[10px] font-semibold sm:px-3 sm:text-xs">
                        Done
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
