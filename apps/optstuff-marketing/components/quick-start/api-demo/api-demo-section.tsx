"use client";

import { cn } from "@workspace/ui/lib/utils";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { CODE_EXAMPLES } from "../constants";
import type { CodeTab } from "../types";
import { TypewriterCode } from "./typewriter-code";

/** API Demo Section */
export function ApiDemoSection() {
  const [activeTab, setActiveTab] = useState<CodeTab>("curl");
  const [copied, setCopied] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(CODE_EXAMPLES[activeTab]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const handleTabChange = (tab: CodeTab): void => {
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
          code={CODE_EXAMPLES[activeTab]}
          isTyping={isTyping}
          isResponse={activeTab === "response"}
        />

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[10px] font-medium text-white/80 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white sm:top-4 sm:right-4 sm:gap-1.5 sm:rounded-lg sm:px-3 sm:py-1.5 sm:text-xs"
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
