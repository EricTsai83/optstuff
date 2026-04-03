"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { cn } from "@workspace/ui/lib/utils";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CODE_EXAMPLES } from "../constants";
import type { CodeTab } from "../types";
import { TypewriterCode } from "./typewriter-code";

const API_DEMO_TABS: readonly CodeTab[] = ["signedUrl", "server", "headers"];

const API_DEMO_TAB_LABEL: Record<CodeTab, string> = {
  signedUrl: "Signed URL",
  server: "Server Helper",
  headers: "Response",
};

const API_DEMO_META: Record<
  CodeTab,
  {
    readonly eyebrow: string;
    readonly title: string;
    readonly description: string;
    readonly facts: readonly string[];
    readonly docPath: string;
  }
> = {
  signedUrl: {
    eyebrow: "Delivery Contract",
    title: "A single signed URL defines the exact image request.",
    description:
      "The URL carries your project slug, operations, public key, signature, and optional expiration. Same URL, same output.",
    facts: [
      "project slug in the path",
      "public key in the query",
      "signature locks the request",
    ],
    docPath: "/api-reference/endpoint",
  },
  server: {
    eyebrow: "Server-Side Signing",
    title:
      "Your app signs the payload with `sk_...` before the browser sees it.",
    description:
      "OptStuff's security model stays intact because the secret key never leaves your server. The client only gets the finished URL.",
    facts: [
      "HMAC-SHA256 signing",
      "secret key stays server-only",
      "expiration is optional",
    ],
    docPath: "/guides/url-signing",
  },
  headers: {
    eyebrow: "Optimized Delivery",
    title: "Successful requests return image bytes plus CDN-friendly headers.",
    description:
      "OptStuff behaves like an image delivery endpoint: optimized binary content, immutable caching, and timing metadata for debugging.",
    facts: ["image/webp output", "immutable caching", "Server-Timing included"],
    docPath: "/api-reference/endpoint",
  },
};

const FLOW_STEPS = [
  {
    tab: "signedUrl" as const,
    title: "Build the transform",
    description: "Encode width, quality, and format directly in the path.",
  },
  {
    tab: "server" as const,
    title: "Sign on the server",
    description:
      "Approve that exact payload with `sk_...` and add `key`, `sig`, and `exp`.",
  },
  {
    tab: "headers" as const,
    title: "Deliver and cache",
    description: "Return optimized image bytes with long-lived cache headers.",
  },
] as const;

const PILL_BUTTON =
  "border-border bg-secondary/40 text-muted-foreground hover:border-accent/20 hover:bg-accent/10 hover:text-foreground inline-flex items-center gap-1.5 rounded-full border text-xs font-medium transition-colors";

const FOCUS_RING =
  "focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function ApiDemoSection() {
  const [activeTab, setActiveTab] = useState<CodeTab>("signedUrl");
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeIndex = API_DEMO_TABS.indexOf(activeTab);
  const activeMeta = API_DEMO_META[activeTab];

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(CODE_EXAMPLES[activeTab]);
      setCopied(true);
      if (copyTimeoutRef.current !== null) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
        copyTimeoutRef.current = null;
      }, 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const navigateStep = (direction: "prev" | "next"): void => {
    const nextTab =
      API_DEMO_TABS[activeIndex + (direction === "prev" ? -1 : 1)];
    if (nextTab) setActiveTab(nextTab);
  };

  return (
    <div className="border-border bg-card/80 relative overflow-hidden rounded-[30px] border shadow-2xl backdrop-blur-xl">
      <BackgroundDecor />

      <div className="relative min-w-0">
        <div className="border-border bg-card/90 sticky top-3 z-20 border-b px-4 py-3 backdrop-blur-xl">
          <MobileStepNav
            activeIndex={activeIndex}
            totalSteps={FLOW_STEPS.length}
            title={FLOW_STEPS[activeIndex]?.title}
            onNavigate={navigateStep}
          />
          <DesktopStepTabs
            activeIndex={activeIndex}
            onTabChange={setActiveTab}
          />
        </div>

        <StepDescription meta={activeMeta} activeIndex={activeIndex} />

        <CodePanel
          activeTab={activeTab}
          copied={copied}
          onCopy={handleCopy}
        />

        <p className="sr-only" aria-live="polite">
          {copied
            ? `${API_DEMO_TAB_LABEL[activeTab]} code copied to clipboard`
            : ""}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Background decorative elements
// ---------------------------------------------------------------------------

function BackgroundDecor() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="bg-accent/10 absolute left-0 top-0 h-48 w-48 rounded-full blur-3xl" />
      <div className="bg-accent/5 absolute bottom-0 right-0 h-56 w-56 rounded-full blur-3xl" />
      <div className="bg-linear-to-r via-accent/70 absolute inset-x-0 top-0 h-px from-transparent to-transparent" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile: prev / next step navigation
// ---------------------------------------------------------------------------

function MobileStepNav({
  activeIndex,
  totalSteps,
  title,
  onNavigate,
}: {
  readonly activeIndex: number;
  readonly totalSteps: number;
  readonly title: string | undefined;
  readonly onNavigate: (direction: "prev" | "next") => void;
}) {
  const navButtonClass = cn(
    "border-border bg-secondary/40 text-foreground inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200",
    FOCUS_RING,
  );

  return (
    <div className="flex items-center gap-3 sm:hidden">
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-[0.24em]">
          Step {activeIndex + 1} / {totalSteps}
        </p>
        <p className="text-foreground mt-1 truncate text-sm font-medium">
          {title}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onNavigate("prev")}
          disabled={activeIndex === 0}
          aria-label="Go to previous step"
          className={cn(
            navButtonClass,
            activeIndex === 0
              ? "cursor-not-allowed opacity-35"
              : "hover:border-accent/20 hover:bg-accent/10",
          )}
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate("next")}
          disabled={activeIndex === totalSteps - 1}
          aria-label="Go to next step"
          className={cn(
            navButtonClass,
            activeIndex === totalSteps - 1
              ? "cursor-not-allowed opacity-35"
              : "hover:border-accent/20 hover:bg-accent/10",
          )}
        >
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Desktop: horizontal step tabs
// ---------------------------------------------------------------------------

function DesktopStepTabs({
  activeIndex,
  onTabChange,
}: {
  readonly activeIndex: number;
  readonly onTabChange: (tab: CodeTab) => void;
}) {
  return (
    <div className="-mx-1 hidden snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex [&::-webkit-scrollbar]:hidden">
      {FLOW_STEPS.map((step, index) => {
        const isCurrent = index === activeIndex;

        return (
          <button
            key={`step-tab-${step.title}`}
            type="button"
            onClick={() => onTabChange(step.tab)}
            aria-current={isCurrent ? "step" : undefined}
            aria-pressed={isCurrent}
            className={cn(
              "min-w-[160px] snap-start rounded-full border px-3 py-2.5 text-left transition-all duration-200 sm:min-w-fit",
              FOCUS_RING,
              isCurrent
                ? "border-accent/20 bg-accent/10 text-foreground shadow-lg"
                : "border-border bg-secondary/40 text-muted-foreground hover:border-accent/20 hover:bg-accent/10 hover:text-foreground",
            )}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold tabular-nums transition-colors",
                  isCurrent
                    ? "border-accent/24 bg-accent/10 text-accent-foreground"
                    : "border-border bg-muted text-muted-foreground",
                )}
              >
                {`0${index + 1}`}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{step.title}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step description + action buttons
// ---------------------------------------------------------------------------

function StepDescription({
  meta,
  activeIndex,
}: {
  readonly meta: (typeof API_DEMO_META)[CodeTab];
  readonly activeIndex: number;
}) {
  const docsBaseUrl = process.env.NEXT_PUBLIC_DOCS_URL?.replace(/\/+$/, "");
  const docsHref = docsBaseUrl ? `${docsBaseUrl}${meta.docPath}` : null;

  return (
    <div className="border-border border-b px-4 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
      <div className="flex min-h-52 flex-col gap-4 sm:min-h-44 lg:h-40 lg:justify-between">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.22em]">
              {meta.eyebrow}
            </p>
            <h4 className="text-foreground max-w-2xl text-xl font-semibold tracking-tight sm:text-2xl">
              {meta.title}
            </h4>
            <p className="text-muted-foreground max-w-2xl text-sm leading-6">
              {meta.description}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:max-w-[420px] lg:justify-end">
            {docsHref ? (
              <a
                href={docsHref}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(PILL_BUTTON, "px-3 py-2")}
              >
                Docs
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            ) : null}

            <HowItWorksPopover meta={meta} activeIndex={activeIndex} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// "How it works" popover
// ---------------------------------------------------------------------------

function HowItWorksPopover({
  meta,
  activeIndex,
}: {
  readonly meta: (typeof API_DEMO_META)[CodeTab];
  readonly activeIndex: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-expanded={open}
          className={cn(PILL_BUTTON, FOCUS_RING, "px-3 py-2")}
        >
          <CircleHelp aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          <span>How it works</span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="bg-popover/95 border-border text-popover-foreground w-[min(24rem,calc(100vw-2rem))] rounded-[24px] p-0 shadow-xl backdrop-blur-xl"
      >
        <div className="overflow-hidden rounded-[24px]">
          <div className="bg-linear-to-r via-accent/60 h-px from-transparent to-transparent" />
          <div className="space-y-4 p-4 sm:p-5">
            <div className="space-y-2">
              <div className="border-border bg-secondary/50 text-muted-foreground inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em]">
                How it works
              </div>
              <p className="text-muted-foreground text-sm leading-6">
                Each example maps to the same delivery flow: define the request,
                sign it server-side, then return an optimized image with
                cache-friendly headers.
              </p>
            </div>

            <div className="border-border bg-muted/30 rounded-[20px] border p-3.5">
              <p className="text-accent text-[11px] font-medium uppercase tracking-[0.18em]">
                Current step
              </p>
              <p className="text-foreground mt-2 text-sm font-medium">
                {FLOW_STEPS[activeIndex]?.title ?? "Delivery flow"}
              </p>
              <p className="text-muted-foreground mt-1 text-sm leading-6">
                {FLOW_STEPS[activeIndex]?.description}
              </p>
            </div>

            <ul className="space-y-2">
              {meta.facts.map((fact) => (
                <li
                  key={fact}
                  className="text-muted-foreground flex items-start gap-2 text-sm leading-6"
                >
                  <span className="bg-accent mt-2 h-1.5 w-1.5 shrink-0 rounded-full" />
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// Code display panel
// ---------------------------------------------------------------------------

function CodePanel({
  activeTab,
  copied,
  onCopy,
}: {
  readonly activeTab: CodeTab;
  readonly copied: boolean;
  readonly onCopy: () => Promise<void>;
}) {
  return (
    <div className="relative px-4 pb-4 pt-4 sm:px-6 sm:pb-6">
      <div className="bg-linear-to-r via-border pointer-events-none absolute inset-x-6 top-0 h-px from-transparent to-transparent" />
      <div className="border-border bg-card/65 relative overflow-hidden rounded-[26px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="bg-linear-to-r via-accent/20 pointer-events-none absolute inset-x-0 top-0 h-px from-transparent to-transparent" />
        <div className="bg-linear-to-b from-accent/20 via-accent/5 pointer-events-none absolute inset-y-0 left-0 w-px to-transparent" />
        <div className="bg-linear-to-b from-accent/5 pointer-events-none absolute inset-x-0 top-0 h-16 to-transparent" />
        <TypewriterCode
          key={activeTab}
          code={CODE_EXAMPLES[activeTab]}
          copied={copied}
          onCopy={onCopy}
          variant={activeTab}
        />
      </div>
    </div>
  );
}
