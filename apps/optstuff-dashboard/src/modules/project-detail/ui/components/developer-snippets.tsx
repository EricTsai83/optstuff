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
    <div className="flex overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-lg dark:border-white/[0.08] dark:bg-[#0a0a0a] dark:shadow-2xl">
      {/* ── Framework sidebar ── */}
      <div className="flex w-[140px] shrink-0 flex-col border-r border-black/[0.06] bg-[#f0f0f0] dark:border-white/[0.06] dark:bg-[#0e0e0e]">
        <div className="px-3 pt-3 pb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#999] dark:text-[#555]">
            Stack
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-0.5 px-2 pb-2">
          {frameworks.map((fw) => (
            <button
              key={fw.id}
              type="button"
              onClick={() => setActiveFrameworkId(fw.id)}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-left text-[13px] font-medium transition-colors",
                fw.id === activeFrameworkId
                  ? "bg-white text-[#111] shadow-sm dark:bg-[#1a1a1a] dark:text-[#f0f0f0]"
                  : "text-[#666] hover:text-[#333] dark:text-[#777] dark:hover:text-[#aaa]",
              )}
            >
              <FrameworkIcon id={fw.id} icon={fw.icon} />{" "}
              {fw.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Editor panel ── */}
      <div className="flex min-w-0 flex-1 flex-col">
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

        {/* ── Tab bar ── */}
        <div className="relative flex items-end bg-[#f6f6f6] dark:bg-[#0f0f0f]">
          {/* Bottom border that sits behind tabs */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-black/[0.06] dark:bg-white/[0.06]" />
          <div className="scrollbar-hide relative flex flex-1 overflow-x-auto">
            {activeFramework.tabs.map((tab, index) => {
              const isActive = tab.id === activeTabId;
              const prevTab = activeFramework.tabs[index - 1];
              const isPrevActive = prevTab?.id === activeTabId;
              const isLast = index === activeFramework.tabs.length - 1;

              return (
                <div key={tab.id} className="flex shrink-0">
                  {!(isActive || isPrevActive) && (
                    <div className="w-px bg-black/[0.08] dark:bg-white/[0.08]" />
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveTab(activeFramework.id, tab.id)}
                    className={cn(
                      "relative flex h-9 shrink-0 items-center gap-2 px-5 text-[13px] transition-colors",
                      isActive
                        ? "z-10 border-x border-t-2 border-x-black/[0.06] border-t-blue-500 bg-white text-[#111] dark:border-x-white/[0.06] dark:bg-[#0a0a0a] dark:text-[#f0f0f0]"
                        : "border-t-2 border-t-transparent text-[#666] hover:text-[#333] dark:text-[#777] dark:hover:text-[#aaa]",
                    )}
                  >
                    <FileIcon lang={tab.lang} />
                    {tab.label}
                  </button>
                  {isLast && !isActive && (
                    <div className="w-px bg-black/[0.08] dark:bg-white/[0.08]" />
                  )}
                </div>
              );
            })}
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
    </div>
  );
}

const FRAMEWORK_ICON_COLORS: Record<string, string> = {
  typescript: "text-[#3178c6]",
  nextjs: "text-black dark:text-white",
};

function FrameworkIcon({ id, icon }: { id: string; icon: string }) {
  return (
    <span
      className={cn(
        "inline-flex w-4 shrink-0 justify-center text-xs font-bold",
        FRAMEWORK_ICON_COLORS[id],
      )}
    >
      {icon}
    </span>
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
