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

export function ApiDemoSection() {
  const [activeTab, setActiveTab] = useState<CodeTab>("signedUrl");
  const [copied, setCopied] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeIndex = API_DEMO_TABS.indexOf(activeTab);
  const activeMeta = API_DEMO_META[activeTab];
  const docsBaseUrl = process.env.NEXT_PUBLIC_DOCS_URL?.replace(/\/+$/, "");
  const docsHref = docsBaseUrl ? `${docsBaseUrl}${activeMeta.docPath}` : null;

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

  const handleTabChange = (tab: CodeTab): void => {
    setActiveTab(tab);
  };

  const handleStepNavigation = (direction: "prev" | "next"): void => {
    const nextIndex = direction === "prev" ? activeIndex - 1 : activeIndex + 1;

    const nextTab = API_DEMO_TABS[nextIndex];

    if (nextTab) {
      setActiveTab(nextTab);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-slate-950/80 shadow-[0_24px_120px_-48px_rgba(56,189,248,0.45)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="bg-linear-to-r absolute inset-x-0 top-0 h-px from-transparent via-cyan-300/70 to-transparent" />
      </div>

      <div className="relative min-w-0">
        <div className="bg-slate-950/88 sticky top-3 z-20 border-b border-white/10 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3 sm:hidden">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-white/45">
                Step {activeIndex + 1} / {FLOW_STEPS.length}
              </p>
              <p className="mt-1 truncate text-sm font-medium text-white">
                {FLOW_STEPS[activeIndex]?.title}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStepNavigation("prev")}
                disabled={activeIndex === 0}
                aria-label="Go to previous step"
                className={cn(
                  "bg-white/4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                  activeIndex === 0
                    ? "cursor-not-allowed opacity-35"
                    : "hover:bg-sky-300/8 hover:border-sky-300/20",
                )}
              >
                <ChevronLeft aria-hidden="true" className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => handleStepNavigation("next")}
                disabled={activeIndex === FLOW_STEPS.length - 1}
                aria-label="Go to next step"
                className={cn(
                  "bg-white/4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                  activeIndex === FLOW_STEPS.length - 1
                    ? "cursor-not-allowed opacity-35"
                    : "hover:bg-sky-300/8 hover:border-sky-300/20",
                )}
              >
                <ChevronRight aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="-mx-1 hidden snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex [&::-webkit-scrollbar]:hidden">
            {FLOW_STEPS.map((step, index) => {
              const isCurrent = index === activeIndex;

              return (
                <button
                  key={`step-tab-${step.title}`}
                  type="button"
                  onClick={() => handleTabChange(step.tab)}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-pressed={isCurrent}
                  className={cn(
                    "min-w-[160px] snap-start rounded-full border px-3 py-2.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:min-w-fit",
                    isCurrent
                      ? "border-emerald-300/20 bg-emerald-300/10 text-white shadow-[0_12px_30px_-24px_rgba(52,211,153,0.5)]"
                      : "bg-white/4 text-white/72 hover:bg-sky-300/8 border-white/10 hover:border-sky-300/20 hover:text-white",
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold tabular-nums transition-colors",
                        isCurrent
                          ? "border-emerald-300/24 bg-emerald-300/10 text-emerald-50"
                          : "border-sky-200/16 bg-sky-300/8 text-sky-100/80",
                      )}
                    >
                      {`0${index + 1}`}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {step.title}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-b border-white/10 px-4 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
          <div className="flex min-h-52 flex-col gap-4 sm:min-h-44 lg:h-40 lg:justify-between">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-sky-100/70">
                  {activeMeta.eyebrow}
                </p>
                <h4 className="max-w-2xl text-xl font-semibold tracking-tight text-white sm:text-2xl">
                  {activeMeta.title}
                </h4>
                <p className="text-white/62 max-w-2xl text-sm leading-6">
                  {activeMeta.description}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2 lg:max-w-[420px] lg:justify-end">
                {docsHref ? (
                  <a
                    href={docsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/4 text-white/72 hover:border-emerald-200/18 hover:bg-emerald-300/8 inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-xs font-medium transition-colors hover:text-white"
                  >
                    Docs
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                ) : null}

                <Popover open={howItWorksOpen} onOpenChange={setHowItWorksOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-expanded={howItWorksOpen}
                      className="bg-white/4 text-white/72 hover:border-emerald-200/18 hover:bg-emerald-300/8 inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-xs font-medium transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/55 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                    >
                      <CircleHelp
                        aria-hidden="true"
                        className="h-3.5 w-3.5 shrink-0"
                      />
                      <span>How it works</span>
                      <ChevronDown
                        aria-hidden="true"
                        className={cn(
                          "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                          howItWorksOpen && "rotate-180",
                        )}
                      />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    sideOffset={10}
                    className="bg-slate-950/96 w-[min(24rem,calc(100vw-2rem))] rounded-[24px] border-white/10 p-0 text-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.85)] backdrop-blur-xl"
                  >
                    <div className="overflow-hidden rounded-[24px]">
                      <div className="bg-linear-to-r h-px from-transparent via-cyan-300/60 to-transparent" />
                      <div className="space-y-4 p-4 sm:p-5">
                        <div className="space-y-2">
                          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-sky-100/70">
                            How it works
                          </div>
                          <p className="text-white/62 text-sm leading-6">
                            Each example maps to the same delivery flow: define
                            the request, sign it server-side, then return an
                            optimized image with cache-friendly headers.
                          </p>
                        </div>

                        <div className="bg-white/3 rounded-[20px] border border-white/10 p-3.5">
                          <p className="text-emerald-200/72 text-[11px] font-medium uppercase tracking-[0.18em]">
                            Current step
                          </p>
                          <p className="mt-2 text-sm font-medium text-white">
                            {FLOW_STEPS[activeIndex]?.title ?? "Delivery flow"}
                          </p>
                          <p className="text-white/58 mt-1 text-sm leading-6">
                            {FLOW_STEPS[activeIndex]?.description}
                          </p>
                        </div>

                        <ul className="space-y-2">
                          {activeMeta.facts.map((fact) => (
                            <li
                              key={fact}
                              className="text-white/62 flex items-start gap-2 text-sm leading-6"
                            >
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300/80" />
                              <span>{fact}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>

        <div className="relative px-4 pb-4 pt-4 sm:px-6 sm:pb-6">
          <div className="bg-linear-to-r pointer-events-none absolute inset-x-6 top-0 h-px from-transparent via-white/10 to-transparent" />
          <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-slate-950/65 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="bg-linear-to-r pointer-events-none absolute inset-x-0 top-0 h-px from-transparent via-emerald-300/20 to-transparent" />
            <div className="bg-linear-to-b from-sky-300/28 pointer-events-none absolute inset-y-0 left-0 w-px via-sky-300/5 to-transparent" />
            <div className="bg-linear-to-b from-emerald-300/4 pointer-events-none absolute inset-x-0 top-0 h-16 to-transparent" />
            <TypewriterCode
              key={activeTab}
              code={CODE_EXAMPLES[activeTab]}
              copied={copied}
              onCopy={handleCopy}
              variant={activeTab}
            />
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          {copied
            ? `${API_DEMO_TAB_LABEL[activeTab]} code copied to clipboard`
            : ""}
        </p>
      </div>
    </div>
  );
}
