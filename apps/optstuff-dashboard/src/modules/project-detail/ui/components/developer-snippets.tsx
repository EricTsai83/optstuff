"use client";

import { CopyButton } from "@workspace/ui/components/copy-button";
import { cn } from "@workspace/ui/lib/utils";
import { useState } from "react";

type SnippetTab = {
  readonly id: string;
  readonly label: string;
  readonly lang: string;
  readonly raw: string;
  readonly html: string;
};

type Framework = {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly tabs: readonly SnippetTab[];
};

type DeveloperSnippetsProps = {
  readonly frameworks: readonly Framework[];
};

export type { SnippetTab, Framework };

export function DeveloperSnippets({ frameworks }: DeveloperSnippetsProps) {
  const [activeFrameworkId, setActiveFrameworkId] = useState(
    frameworks[0]?.id ?? "",
  );
  const activeFramework =
    frameworks.find((f) => f.id === activeFrameworkId) ?? frameworks[0];

  const [activeTabMap, setActiveTabMap] = useState<Record<string, string>>({});

  if (!activeFramework) return null;

  const activeTabId =
    activeTabMap[activeFramework.id] ?? activeFramework.tabs[0]?.id ?? "";
  const activeTab =
    activeFramework.tabs.find((t) => t.id === activeTabId) ??
    activeFramework.tabs[0];

  if (!activeTab) return null;

  function setActiveTab(frameworkId: string, tabId: string) {
    setActiveTabMap((prev) => ({ ...prev, [frameworkId]: tabId }));
  }

  return (
    <div className="overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-lg dark:border-white/[0.08] dark:bg-[#0a0a0a] dark:shadow-2xl">
      {/* ── Title bar ── */}
      <div className="relative flex h-10 items-center border-b border-black/[0.06] bg-[#f6f6f6] px-4 dark:border-white/[0.06] dark:bg-[#0f0f0f]">
        <div className="flex gap-2">
          <div className="size-3 rounded-full bg-[#ff5f57] transition-opacity hover:opacity-80" />
          <div className="size-3 rounded-full bg-[#febc2e] transition-opacity hover:opacity-80" />
          <div className="size-3 rounded-full bg-[#28c840] transition-opacity hover:opacity-80" />
        </div>
        <span className="absolute inset-x-0 text-center text-xs font-medium text-[#555] dark:text-[#888]">
          Quick Start — OptStuff
        </span>
      </div>

      {/* ── Framework selector ── */}
      {frameworks.length > 1 && (
        <div className="flex items-center gap-1 border-b border-black/[0.06] bg-[#f0f0f0] px-3 py-1.5 dark:border-white/[0.06] dark:bg-[#111]">
          {frameworks.map((fw) => (
            <button
              key={fw.id}
              type="button"
              onClick={() => setActiveFrameworkId(fw.id)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                fw.id === activeFrameworkId
                  ? "bg-white text-[#111] shadow-sm dark:bg-[#222] dark:text-[#f0f0f0]"
                  : "text-[#666] hover:text-[#333] dark:text-[#777] dark:hover:text-[#aaa]",
              )}
            >
              {fw.icon} {fw.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Tab bar ── */}
      <div className="flex items-center border-b border-black/[0.06] bg-[#f6f6f6] dark:border-white/[0.06] dark:bg-[#0f0f0f]">
        <div className="scrollbar-hide flex flex-1 overflow-x-auto">
          {activeFramework.tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(activeFramework.id, tab.id)}
              className={cn(
                "relative flex h-9 shrink-0 items-center gap-2 px-5 text-[13px] transition-colors",
                tab.id === activeTabId
                  ? "text-[#111] dark:text-[#f0f0f0]"
                  : "text-[#666] hover:text-[#333] dark:text-[#777] dark:hover:text-[#aaa]",
              )}
            >
              <FileIcon lang={tab.lang} />
              {tab.label}
              {tab.id === activeTabId && (
                <div className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-[#888] dark:bg-[#888]" />
              )}
            </button>
          ))}
        </div>
        <div className="pr-2">
          <CopyButton
            text={activeTab.raw}
            className="size-7 rounded-md text-[#666] hover:bg-black/[0.04] hover:text-[#333] dark:text-[#777] dark:hover:bg-white/[0.06] dark:hover:text-[#bbb]"
          />
        </div>
      </div>

      {/* ── Editor area ── */}
      <div
        className="scrollbar-editor h-[420px] overflow-auto bg-white text-[13px] leading-[1.7] dark:bg-[#0a0a0a] [&_code]:!block [&_code]:min-w-fit [&_pre]:!bg-transparent [&_pre]:py-3 [&_pre]:pl-0 [&_pre]:pr-4 [&_span.line]:inline-block [&_span.line]:w-full [&_span.line]:pl-4"
        dangerouslySetInnerHTML={{ __html: activeTab.html }}
      />
    </div>
  );
}

function FileIcon({ lang }: { lang: string }) {
  const color =
    lang === "typescript" || lang === "tsx"
      ? "bg-[#3178c6]"
      : lang === "bash"
        ? "bg-[#89e051]"
        : "bg-[#e44d26]";

  return <div className={cn("size-2.5 shrink-0 rounded-sm", color)} />;
}
