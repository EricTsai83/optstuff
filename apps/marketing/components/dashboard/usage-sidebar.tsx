"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";

const usageData = [
  {
    name: "Image Optimization - Transformations",
    used: 554,
    total: "5K",
    icon: "green",
  },
  {
    name: "Speed Insights Data Points",
    used: 405,
    total: "10K",
    icon: "green",
  },
  {
    name: "Image Optimization - Cache Writes",
    used: "2.8K",
    total: "100K",
    icon: "green",
  },
  { name: "Fluid Active CPU", used: "5m 57s", total: "4h", icon: "green" },
  {
    name: "Edge Function Invocations",
    used: "1.2K",
    total: "50K",
    icon: "green",
  },
  {
    name: "Bandwidth",
    used: "45GB",
    total: "500GB",
    icon: "green",
  },
  {
    name: "Serverless Function Execution Time",
    used: "2h 15m",
    total: "24h",
    icon: "green",
  },
  {
    name: "Database Queries",
    used: "8.5K",
    total: "100K",
    icon: "green",
  },
  {
    name: "API Requests",
    used: "12.3K",
    total: "200K",
    icon: "green",
  },
  {
    name: "Storage Operations",
    used: "3.1K",
    total: "50K",
    icon: "green",
  },
];

const recentPreviews = [
  {
    title: "Enhance CodeBlock component and integ...",
    badge: "Preview",
    pr: "#12",
    commit: "JGMZ87D0W",
    avatars: [{ color: "bg-yellow-500" }, { color: "bg-green-500" }],
  },
  {
    title: "Translate SVG comments in LogoIcon com...",
    badge: "Preview",
    pr: "#11",
    commit: "DWfEUtfNt",
    avatars: [{ color: "bg-yellow-500" }, { color: "bg-green-500" }],
  },
  {
    title: "Update favicon.ico to a new version for im...",
    badge: "Preview",
    pr: "#10",
    commit: "BwbBPdVbz",
    avatars: [{ color: "bg-yellow-500" }, { color: "bg-green-500" }],
  },
];

export function UsageSidebar() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="hidden w-80 shrink-0 space-y-6 md:block">
      {/* Usage section */}
      <div>
        <h3 className="mb-3 text-sm font-medium">Usage</h3>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-muted-foreground text-sm font-normal">
                Last 30 days
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="h-7 bg-transparent text-xs"
              >
                Upgrade
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="overflow-hidden">
              <div
                className="space-y-3 transition-[max-height] duration-300 ease-in-out"
                style={{
                  maxHeight: isExpanded ? "1000px" : "120px",
                }}
              >
                {usageData.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-foreground">{item.name}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {item.used} / {item.total}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {usageData.length > 3 && (
              <div className="relative flex justify-center">
                <Separator className="absolute top-3 left-0 w-full" />
                <Button
                  variant="outline"
                  size="sm"
                  className="text-muted-foreground z-10 h-6 w-6 justify-center rounded-full transition-colors"
                  onClick={() => setIsExpanded(!isExpanded)}
                  aria-expanded={isExpanded}
                  aria-label={
                    isExpanded
                      ? "Collapse usage details"
                      : "Expand usage details"
                  }
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts section */}
      <div>
        <h3 className="mb-3 text-sm font-medium">Alerts</h3>
        <Card>
          <CardContent className="space-y-3 pt-6 text-center">
            <h4 className="font-medium">Get alerted for anomalies</h4>
            <p className="text-muted-foreground text-sm">
              Automatically monitor your projects for anomalies and get
              notified.
            </p>
            <Button variant="outline" className="w-full bg-transparent">
              Upgrade to Observability Plus
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Previews section */}
      <div>
        <h3 className="mb-3 text-sm font-medium">Recent Previews</h3>
        <div className="space-y-2">
          {recentPreviews.map((preview, index) => (
            <Card
              key={index}
              className="hover:bg-secondary/50 cursor-pointer transition-colors"
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex shrink-0 -space-x-1">
                      {preview.avatars.map((avatar, i) => (
                        <div
                          key={i}
                          className={`h-5 w-5 rounded-full ${avatar.color} border-background border-2`}
                        />
                      ))}
                    </div>
                    <span className="truncate text-sm">{preview.title}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                  >
                    <span className="text-muted-foreground">•••</span>
                  </Button>
                </div>
                <div className="mt-2 ml-7 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {preview.badge}
                  </Badge>
                  <span className="text-muted-foreground flex items-center gap-1 text-xs">
                    <svg
                      className="h-3 w-3"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M5 3.25a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5A.75.75 0 015 3.25zm0 9.5a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75z" />
                      <path
                        fillRule="evenodd"
                        d="M8 1a.75.75 0 01.75.75v12.5a.75.75 0 01-1.5 0V1.75A.75.75 0 018 1z"
                      />
                    </svg>
                    {preview.pr}
                  </span>
                  <span className="text-muted-foreground flex items-center gap-1 text-xs">
                    <span className="bg-muted-foreground h-1.5 w-1.5 rounded-full" />
                    {preview.commit}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
