"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Check, Copy, Terminal, ArrowRight, Eye, EyeOff } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

type Step = {
  readonly number: string;
  readonly title: string;
  readonly description: string;
};

const STEPS: readonly Step[] = [
  {
    number: "1",
    title: "Create a Project",
    description: "Sign up and create a project in your dashboard.",
  },
  {
    number: "2",
    title: "Get API Key",
    description: "Your project includes a default API key ready to use.",
  },
  {
    number: "3",
    title: "Start Optimizing",
    description: "Use the API to optimize images instantly.",
  },
] as const;

export function IntegrationSteps() {
  const { visibleSteps, setStepRef } = useStepVisibility(STEPS.length);

  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24 md:px-8">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0">
        <div className="bg-accent/5 absolute left-1/4 top-1/4 h-64 w-64 rounded-full blur-3xl sm:h-96 sm:w-96" />
        <div className="bg-accent/3 absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full blur-3xl sm:h-64 sm:w-64" />
      </div>

      <div className="relative mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center sm:mb-20">
          <div className="animate-fade-in border-accent/30 bg-accent/10 text-accent mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium sm:px-4 sm:text-sm">
            <Terminal className="h-3 w-3 sm:h-4 sm:w-4" />
            Quick Start
          </div>
          <h2 className="text-foreground animate-fade-in-up animation-delay-100 mb-3 text-2xl font-bold tracking-tight sm:mb-4 sm:text-3xl md:text-4xl lg:text-5xl">
            Three steps to faster images
          </h2>
          <p className="text-muted-foreground animate-fade-in-up animation-delay-200 mx-auto max-w-2xl text-sm sm:text-base md:text-lg">
            Get started in minutes with a simple integration.
          </p>
        </div>

        {/* Vertical timeline */}
        <div className="relative">
          {STEPS.map((step, index) => {
            const isVisible = visibleSteps.has(index);
            const isLast = index === STEPS.length - 1;

            return (
              <div
                key={step.number}
                ref={setStepRef(index)}
                className={cn(
                  "relative transition-all duration-700",
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-12 opacity-0",
                  !isLast && "pb-12 sm:pb-16",
                )}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                {/* Connecting line */}
                {!isLast && (
                  <div
                    className={cn(
                      "absolute left-4 top-10 h-[calc(100%-2.5rem)] w-0.5 transition-all duration-1000 sm:left-5 sm:top-12 sm:h-[calc(100%-3rem)] md:left-6",
                      isVisible ? "bg-accent/30" : "bg-border/30",
                    )}
                    style={{ transitionDelay: `${index * 200 + 300}ms` }}
                  />
                )}

                {/* Step content */}
                <div className="flex gap-4 sm:gap-6 md:gap-8">
                  {/* Left: Step number */}
                  <div className="relative z-10 shrink-0">
                    <div
                      className={cn(
                        "bg-accent text-accent-foreground flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold shadow-lg transition-all duration-500 sm:h-10 sm:w-10 sm:rounded-xl sm:text-base md:h-12 md:w-12 md:text-lg",
                        isVisible ? "scale-100" : "scale-0",
                      )}
                      style={{
                        transitionDelay: `${index * 200 + 100}ms`,
                        boxShadow: isVisible
                          ? "0 0 30px hsl(var(--accent) / 0.3)"
                          : "none",
                      }}
                    >
                      {step.number}
                    </div>
                  </div>

                  {/* Right: Title + Demo */}
                  <div className="min-w-0 flex-1">
                    {/* Title area */}
                    <div className="mb-3 sm:mb-4">
                      <h3 className="text-foreground text-lg font-bold sm:text-xl md:text-2xl">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground mt-0.5 text-xs sm:mt-1 sm:text-sm">
                        {step.description}
                      </p>
                    </div>

                    {/* Demo area */}
                    <div
                      className={cn(
                        "border-border/50 bg-card/50 h-[160px] overflow-hidden rounded-xl border backdrop-blur-sm transition-all duration-500 sm:h-[180px] sm:rounded-2xl md:h-[220px]",
                        isVisible
                          ? "translate-x-0 opacity-100"
                          : "translate-x-8 opacity-0",
                      )}
                      style={{ transitionDelay: `${index * 200 + 200}ms` }}
                    >
                      <div className="h-full p-3 sm:p-4 md:p-5">
                        {index === 0 && <CreateProjectVisual />}
                        {index === 1 && <SetupProjectVisual />}
                        {index === 2 && <OptimizeVisual />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* API Demo Section */}
        <div className="mt-12 sm:mt-20">
          <ApiDemoSection />
        </div>
      </div>
    </section>
  );
}

/** Step 1: Dashboard mock interface */
function CreateProjectVisual() {
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
      <div className="bg-muted/50 flex items-center justify-between border-b border-border/50 px-3 py-1.5 sm:px-4 sm:py-2">
        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className="h-2 w-2 rounded-full bg-[#ff5f57] sm:h-2.5 sm:w-2.5" />
          <div className="h-2 w-2 rounded-full bg-[#febc2e] sm:h-2.5 sm:w-2.5" />
          <div className="h-2 w-2 rounded-full bg-[#28c840] sm:h-2.5 sm:w-2.5" />
          <span className="text-muted-foreground ml-2 hidden text-xs sm:inline">
            Dashboard
          </span>
        </div>

        {/* Add New button */}
        <div className="relative">
          <button
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all sm:gap-1.5 sm:rounded-lg sm:px-3 sm:py-1.5 sm:text-xs",
              step === 0
                ? "border border-accent bg-transparent text-accent ring-2 ring-accent/30"
                : "border border-accent bg-accent text-accent-foreground",
            )}
          >
            <span className="hidden sm:inline">Add New...</span>
            <span className="sm:hidden">Add</span>
            <span className="text-[8px] sm:text-[10px]">▼</span>
          </button>

          {/* Dropdown menu */}
          {step === 1 && (
            <div className="bg-popover absolute right-0 top-full z-10 mt-1 w-28 overflow-hidden rounded-md border border-border/50 py-1 shadow-xl sm:mt-1.5 sm:w-36 sm:rounded-lg sm:py-1.5">
              <div className="cursor-pointer bg-accent/20 px-3 py-1.5 text-[10px] font-medium text-accent sm:px-4 sm:py-2 sm:text-xs">
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
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {(step === 0 || step === 1) && (
          <div className="flex h-full flex-col items-center justify-center">
            <div className="text-muted-foreground/50 text-xs sm:text-sm">
              {step === 0 ? 'Click "Add"' : 'Select "New Project"'}
            </div>
          </div>
        )}

        {isFormStep && (
          <div className="flex h-full flex-col justify-center space-y-2 sm:space-y-3">
            <div className="text-foreground text-xs font-semibold sm:text-sm">
              Create a new app
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              {/* App name input - simplified for mobile */}
              <div className="flex-1">
                <div className="text-muted-foreground mb-1 text-[10px] sm:mb-1.5 sm:text-xs">
                  Name
                </div>
                <div
                  className={cn(
                    "bg-muted/30 flex h-8 items-center rounded-md border px-2 transition-all sm:h-9 sm:rounded-lg sm:px-3",
                    isReadyToSubmit
                      ? "border-border/50"
                      : "border-accent/50 ring-2 ring-accent/20",
                  )}
                >
                  <span className="text-foreground text-[10px] sm:text-xs">
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
                  "h-8 rounded-md px-3 text-[10px] font-medium transition-all sm:h-9 sm:rounded-lg sm:px-4 sm:text-xs",
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
          <div className="flex h-full flex-col items-center justify-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20 sm:h-12 sm:w-12">
              <Check className="h-5 w-5 text-emerald-600 dark:text-green-400 sm:h-6 sm:w-6" />
            </div>
            <div className="text-xs font-medium text-emerald-600 dark:text-green-400 sm:text-sm">
              Project Created!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Step 2: API Key list */
function SetupProjectVisual() {
  const [step, setStep] = useState(0);
  const apiKey = "sk_live_a1b2c3...";
  const maskedKey = "sk_live_*******";

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
    <div className="bg-card flex h-full flex-col overflow-hidden rounded-lg border border-border/50 sm:rounded-xl">
      {/* Mac window header */}
      <div className="bg-muted/50 flex items-center gap-1 border-b border-border/50 px-3 py-1.5 sm:gap-1.5 sm:px-4 sm:py-2">
        <div className="h-2 w-2 rounded-full bg-[#ff5f57] sm:h-2.5 sm:w-2.5" />
        <div className="h-2 w-2 rounded-full bg-[#febc2e] sm:h-2.5 sm:w-2.5" />
        <div className="h-2 w-2 rounded-full bg-[#28c840] sm:h-2.5 sm:w-2.5" />
        <span className="text-muted-foreground ml-2 text-[10px] sm:text-xs">
          API Keys
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-center p-3 sm:p-4">
        <div className="mb-2 sm:mb-3">
          <div className="text-foreground text-xs font-semibold sm:text-sm">
            Standard Keys
          </div>
        </div>

        {/* Key row */}
        <div className="bg-muted/30 flex items-center gap-2 rounded-md border border-border/50 px-3 py-2 sm:gap-3 sm:rounded-lg sm:px-4 sm:py-3">
          <div className="text-foreground/70 shrink-0 text-[10px] sm:text-xs">
            Secret
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <code
              className={cn(
                "min-w-0 flex-1 truncate rounded-md border px-2 py-1 font-mono text-[10px] transition-all duration-300 sm:rounded-lg sm:px-3 sm:py-1.5 sm:text-xs",
                isRevealed
                  ? "border-accent/30 bg-accent/10 text-accent"
                  : "border-border/50 bg-muted/50 text-muted-foreground",
              )}
            >
              {isRevealed ? apiKey : maskedKey}
            </code>
            <button
              className={cn(
                "shrink-0 rounded-md p-1 transition-all duration-300 sm:rounded-lg sm:p-1.5",
                isEyeHighlighted
                  ? "bg-accent/20 text-accent ring-2 ring-accent/40"
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

/** Step 3: Realtime optimization flow visualization */
function OptimizeVisual() {
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
    <div className="flex h-full flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
      {/* Left: Website */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border/50 bg-card sm:flex-[1.5] sm:rounded-xl">
        {/* Mac window header */}
        <div className="flex items-center gap-1 border-b border-border/50 bg-muted/50 px-3 py-1.5 sm:gap-1.5 sm:px-4 sm:py-2">
          <div className="h-2 w-2 rounded-full bg-[#ff5f57] sm:h-2.5 sm:w-2.5" />
          <div className="h-2 w-2 rounded-full bg-[#febc2e] sm:h-2.5 sm:w-2.5" />
          <div className="h-2 w-2 rounded-full bg-[#28c840] sm:h-2.5 sm:w-2.5" />
          <span className="text-muted-foreground ml-2 text-[10px] sm:text-xs">
            yoursite.com
          </span>
        </div>

        {/* Code view */}
        <div className="flex-1 p-2 sm:p-3">
          <div
            className={cn(
              "flex h-full flex-col justify-center overflow-hidden rounded-md border px-2 py-1.5 font-mono transition-all duration-300 sm:rounded-lg sm:px-4 sm:py-3",
              isWebsiteActive
                ? "border-accent/40 bg-accent/5"
                : isWebsiteShowingResult
                  ? "border-green-500/40 bg-green-500/5"
                  : "border-border/50 bg-muted/30",
            )}
          >
            {!isWebsiteShowingResult && (
              <div className="flex flex-wrap items-center text-[9px] leading-relaxed sm:text-xs">
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
                  &quot;optstuff.dev/...&quot;
                </span>
                <span className="text-purple-500 dark:text-purple-400">
                  /&gt;
                </span>
              </div>
            )}

            {isWebsiteShowingResult && (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-8 w-10 items-center justify-center rounded-md bg-green-500/20 sm:h-10 sm:w-12 sm:rounded-lg">
                  <span className="text-sm sm:text-lg">🖼️</span>
                </div>
                <div>
                  <div className="text-[10px] font-medium text-emerald-600 dark:text-green-400 sm:text-sm">
                    hero.webp
                  </div>
                  <div className="text-muted-foreground text-[9px] sm:text-xs">
                    92% smaller
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Middle: Arrows - horizontal on mobile, vertical on desktop */}
      <div className="relative flex items-center justify-center gap-2 px-2 py-1 sm:flex-col sm:gap-3 sm:px-3 sm:py-0">
        {/* Request arrow */}
        <div className="relative flex items-center sm:flex-col">
          <div
            className={cn(
              "h-0.5 w-4 transition-all duration-300 sm:h-4 sm:w-0.5",
              isRequestArrowActive ? "bg-accent" : "bg-muted-foreground/30",
            )}
          />
          <ArrowRight
            className={cn(
              "-ml-0.5 h-4 w-4 transition-all duration-300 sm:-mt-0.5 sm:ml-0 sm:rotate-90",
              isRequestArrowActive ? "text-accent" : "text-muted-foreground/30",
            )}
          />
        </div>

        {/* Response arrow */}
        <div className="relative flex items-center sm:flex-col">
          <ArrowRight
            className={cn(
              "-mr-0.5 h-4 w-4 rotate-180 transition-all duration-300 sm:-mb-0.5 sm:mr-0 sm:rotate-90",
              isResponseArrowActive
                ? "text-emerald-600 dark:text-green-400"
                : "text-muted-foreground/30",
            )}
          />
          <div
            className={cn(
              "h-0.5 w-4 transition-all duration-300 sm:h-4 sm:w-0.5",
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
          "bg-card relative flex flex-1 flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border p-3 transition-all duration-300 sm:gap-3 sm:rounded-xl sm:p-4",
          isOptStuffActive
            ? "border-accent/50"
            : step >= 3
              ? "border-green-500/40"
              : "border-border/50",
        )}
      >
        <div className="relative flex flex-col items-center gap-1 sm:gap-2">
          <div
            className={cn(
              "relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 sm:h-14 sm:w-14 sm:rounded-2xl",
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
                <span className="text-lg sm:text-2xl">⚡</span>
              ) : step >= 3 ? (
                <Check className="h-5 w-5 text-emerald-600 dark:text-green-400 sm:h-7 sm:w-7" />
              ) : (
                <span className="text-lg sm:text-2xl">📦</span>
              )}
            </div>
          </div>

          <div
            className={cn(
              "text-xs font-bold transition-colors duration-300 sm:text-sm",
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

/** API Demo Section */
function ApiDemoSection() {
  const [activeTab, setActiveTab] = useState<"curl" | "js" | "response">(
    "curl",
  );
  const [copied, setCopied] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const codeExamples = {
    curl: `curl "https://api.optstuff.dev/v1/optimize?\\
  url=https://example.com/hero.png&\\
  width=800&format=webp" \\
  -H "Authorization: Bearer sk_live_xxx"`,
    js: `const response = await fetch(
  "https://api.optstuff.dev/v1/optimize?" +
  new URLSearchParams({
    url: "https://example.com/hero.png",
    width: "800",
    format: "webp"
  }),
  { headers: { Authorization: "Bearer sk_live_xxx" } }
);`,
    response: `{
  "success": true,
  "data": {
    "url": "https://cdn.optstuff.dev/optimized/abc123.webp",
    "originalSize": 2457600,
    "optimizedSize": 190464,
    "savings": "92%"
  }
}`,
  };

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(codeExamples[activeTab]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const handleTabChange = (tab: "curl" | "js" | "response"): void => {
    setActiveTab(tab);
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 50);
  };

  return (
    <div className="border-border/50 bg-card/30 overflow-hidden rounded-xl border backdrop-blur-sm sm:rounded-2xl">
      {/* Header */}
      <div className="border-border/50 flex flex-col gap-2 border-b px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1 sm:gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500/80 sm:h-3 sm:w-3" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80 sm:h-3 sm:w-3" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-500/80 sm:h-3 sm:w-3" />
          </div>
          <span className="text-muted-foreground ml-1 text-xs font-medium sm:ml-2 sm:text-sm">
            API Example
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {(["curl", "js", "response"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={cn(
                "rounded-md px-2 py-1 text-[10px] font-medium transition-all duration-200 sm:px-3 sm:text-xs",
                activeTab === tab
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              {tab === "curl" ? "cURL" : tab === "js" ? "JS" : "Response"}
            </button>
          ))}
        </div>
      </div>

      {/* Code Block */}
      <div className="relative">
        <TypewriterCode
          code={codeExamples[activeTab]}
          isTyping={isTyping}
          isResponse={activeTab === "response"}
        />

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[10px] font-medium text-white/80 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white sm:right-4 sm:top-4 sm:gap-1.5 sm:rounded-lg sm:px-3 sm:py-1.5 sm:text-xs"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

type TypewriterCodeProps = {
  readonly code: string;
  readonly isTyping: boolean;
  readonly isResponse?: boolean;
};

function TypewriterCode({ code, isTyping, isResponse }: TypewriterCodeProps) {
  const [displayedCode, setDisplayedCode] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isTyping) {
      setDisplayedCode("");
      setCurrentIndex(0);
    }
  }, [isTyping, code]);

  useEffect(() => {
    if (currentIndex < code.length) {
      const timeout = setTimeout(
        () => {
          setDisplayedCode(code.slice(0, currentIndex + 1));
          setCurrentIndex((prev) => prev + 1);
        },
        isResponse ? 5 : 15,
      );
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, code, isResponse]);

  return (
    <div className="bg-[#0d0d0f] p-3 sm:p-4">
      <pre className="scrollbar-hide overflow-x-auto">
        <code className="font-mono text-[10px] leading-relaxed sm:text-sm">
          <SyntaxHighlight code={displayedCode} isResponse={isResponse} />
          <span className="animate-pulse text-accent">▊</span>
        </code>
      </pre>
    </div>
  );
}

type SyntaxHighlightProps = {
  readonly code: string;
  readonly isResponse?: boolean;
};

function SyntaxHighlight({ code, isResponse }: SyntaxHighlightProps) {
  if (isResponse) {
    const highlighted = code
      .replace(/"([^"]+)":/g, '<span class="text-purple-400">"$1"</span>:')
      .replace(/: "([^"]+)"/g, ': <span class="text-green-400">"$1"</span>')
      .replace(/: (\d+)/g, ': <span class="text-amber-400">$1</span>')
      .replace(/: (true|false)/g, ': <span class="text-blue-400">$1</span>');
    return (
      <span
        className="text-gray-300"
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    );
  }

  const highlighted = code
    .replace(
      /(curl|const|await|fetch|new)/g,
      '<span class="text-purple-400">$1</span>',
    )
    .replace(
      /("https?:\/\/[^"]+"|'https?:\/\/[^']+')/g,
      '<span class="text-green-400">$1</span>',
    )
    .replace(
      /(-H|headers|Authorization|Bearer)/g,
      '<span class="text-amber-400">$1</span>',
    )
    .replace(/(URLSearchParams)/g, '<span class="text-blue-400">$1</span>');

  return (
    <span
      className="text-gray-300"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}

function useStepVisibility(stepCount: number) {
  const [visibleSteps, setVisibleSteps] = useState<Set<number>>(new Set());
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  const setStepRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      stepRefs.current[index] = el;
    },
    [],
  );

  useEffect(() => {
    const observers = stepRefs.current.map((ref, index) => {
      if (!ref) return null;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            setVisibleSteps((prev) => new Set([...prev, index]));
          }
        },
        { threshold: 0.2 },
      );

      observer.observe(ref);
      return observer;
    });

    return () => {
      observers.forEach((observer) => observer?.disconnect());
    };
  }, [stepCount]);

  return { visibleSteps, stepRefs, setStepRef };
}
