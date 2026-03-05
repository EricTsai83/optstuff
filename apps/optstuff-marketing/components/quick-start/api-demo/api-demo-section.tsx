"use client";

import { cn } from "@workspace/ui/lib/utils";
import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CODE_EXAMPLES } from "../constants";
import type { CodeTab } from "../types";
import { TypewriterCode } from "./typewriter-code";

const API_DEMO_TABS: readonly CodeTab[] = ["curl", "js", "response"];

const API_DEMO_TAB_LABEL: Record<CodeTab, string> = {
  curl: "cURL",
  js: "JS",
  response: "Response",
};

/** API Demo Section */
export function ApiDemoSection() {
  const [activeTab, setActiveTab] = useState<CodeTab>("curl");
  const [copied, setCopied] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const tabRefs = useRef<Record<CodeTab, HTMLButtonElement | null>>({
    curl: null,
    js: null,
    response: null,
  });
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) {
        clearTimeout(copyTimeoutRef.current);
      }
      if (typingTimeoutRef.current !== null) {
        clearTimeout(typingTimeoutRef.current);
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
    setIsTyping(true);
    if (typingTimeoutRef.current !== null) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      typingTimeoutRef.current = null;
    }, 50);
  };

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>): void => {
    const currentTabIndex = API_DEMO_TABS.indexOf(activeTab);
    if (currentTabIndex === -1) return;

    let nextTab: CodeTab = activeTab;
    let shouldUpdateTab = false;

    if (event.key === "ArrowRight") {
      nextTab = API_DEMO_TABS[(currentTabIndex + 1) % API_DEMO_TABS.length] ?? activeTab;
      shouldUpdateTab = true;
    } else if (event.key === "ArrowLeft") {
      nextTab =
        API_DEMO_TABS[
          (currentTabIndex - 1 + API_DEMO_TABS.length) % API_DEMO_TABS.length
        ] ?? activeTab;
      shouldUpdateTab = true;
    } else if (event.key === "Home") {
      nextTab = API_DEMO_TABS[0] ?? activeTab;
      shouldUpdateTab = true;
    } else if (event.key === "End") {
      nextTab = API_DEMO_TABS[API_DEMO_TABS.length - 1] ?? activeTab;
      shouldUpdateTab = true;
    }

    if (!shouldUpdateTab) return;
    event.preventDefault();
    handleTabChange(nextTab);
    requestAnimationFrame(() => {
      tabRefs.current[nextTab]?.focus();
    });
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
        <div className="flex gap-1" role="tablist" aria-label="API example tabs">
          {API_DEMO_TABS.map((tab) => (
            <button
              key={tab}
              ref={(element) => {
                tabRefs.current[tab] = element;
              }}
              id={`api-demo-tab-${tab}`}
              type="button"
              onClick={() => handleTabChange(tab)}
              onKeyDown={handleTabKeyDown}
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls={`api-demo-panel-${tab}`}
              tabIndex={activeTab === tab ? 0 : -1}
              className={cn(
                "focus-visible:ring-ring focus-visible:ring-offset-background rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 sm:px-3 sm:text-xs",
                activeTab === tab
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              {API_DEMO_TAB_LABEL[tab]}
            </button>
          ))}
        </div>
      </div>

      {/* Code Block */}
      <div className="relative">
        {API_DEMO_TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <div
              key={tab}
              id={`api-demo-panel-${tab}`}
              role="tabpanel"
              aria-labelledby={`api-demo-tab-${tab}`}
              aria-hidden={!isActive}
              hidden={!isActive}
              tabIndex={isActive ? 0 : -1}
            >
              <TypewriterCode
                code={CODE_EXAMPLES[tab]}
                isTyping={isActive ? isTyping : false}
                isResponse={tab === "response"}
              />
            </div>
          );
        })}

        {/* Copy Button */}
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied code" : "Copy code"}
          className="focus-visible:ring-ring focus-visible:ring-offset-background absolute right-2 top-2 flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-white/80 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 sm:right-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-xs"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Copy</span>
            </>
          )}
        </button>
        <p className="sr-only" aria-live="polite">
          {copied ? `${API_DEMO_TAB_LABEL[activeTab]} code copied to clipboard` : ""}
        </p>
      </div>
    </div>
  );
}
