"use client";

import { useState } from "react";
import { ChevronDown, MoreHorizontal } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";

const recentPreviews = [
  {
    title: "Enhance CodeBlock component and integrate into demos",
    refactorLabel: "Refactor ...",
    badge: "Preview",
    pr: "#12",
    commit: "JGMZ87D0W",
    avatars: [{ color: "bg-yellow-500" }, { color: "bg-green-500" }],
  },
  {
    title: "Translate SVG comments in LogoIcon component from Chinese to E...",
    badge: "Preview",
    pr: "#11",
    commit: "DWfEUtfNt",
    avatars: [{ color: "bg-yellow-500" }, { color: "bg-green-500" }],
  },
];

export function MobileTabs() {
  const [activeTab, setActiveTab] = useState("recents");
  const tabs = [
    { id: "recents", label: "Recents" },
    { id: "usage", label: "Usage" },
    { id: "alerts", label: "Alerts" },
  ];

  return (
    <div className="md:hidden">
      {/* Tab buttons */}
      <div className="border-border flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "text-foreground border-foreground border-b-2"
                : "text-muted-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "recents" && (
        <div className="space-y-3 py-4">
          {recentPreviews.map((preview, index) => (
            <div
              key={index}
              className="border-border border-b pb-3 last:border-0"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-1 items-start gap-2">
                  <div className="mt-0.5 flex shrink-0 -space-x-1">
                    {preview.avatars.map((avatar, i) => (
                      <div
                        key={i}
                        className={`h-5 w-5 rounded-full ${avatar.color} border-background border-2`}
                      />
                    ))}
                  </div>
                  <div className="min-w-0">
                    <span className="line-clamp-2 text-sm">
                      {preview.title}
                      {preview.refactorLabel && (
                        <span className="text-muted-foreground ml-1">
                          {preview.refactorLabel}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2 ml-7 flex items-center gap-2">
                <Badge variant="secondary" className="rounded-full text-xs">
                  ◉ {preview.badge}
                </Badge>
                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                  ⑂ {preview.pr}
                </span>
                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  {preview.commit}
                </span>
              </div>
            </div>
          ))}

          {/* Show more button */}
          <div className="flex justify-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-full p-0"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {activeTab === "usage" && (
        <div className="text-muted-foreground py-4 text-sm">
          Usage information will appear here.
        </div>
      )}

      {activeTab === "alerts" && (
        <div className="text-muted-foreground py-4 text-sm">
          No alerts at this time.
        </div>
      )}
    </div>
  );
}
