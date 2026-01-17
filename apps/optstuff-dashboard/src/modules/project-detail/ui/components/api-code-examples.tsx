"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { CopyButton } from "./copy-button";

type Tab = "curl" | "node" | "python";

const TABS: { id: Tab; label: string }[] = [
  { id: "curl", label: "cURL" },
  { id: "node", label: "Node.js" },
  { id: "python", label: "Python" },
];

type ApiCodeExamplesProps = {
  readonly apiKey: string;
};

export function ApiCodeExamples({ apiKey }: ApiCodeExamplesProps) {
  const [activeTab, setActiveTab] = useState<Tab>("curl");

  const codeExamples: Record<Tab, string> = {
    curl: `curl -X GET "https://api.optstuff.dev/v1/optimize?url=https://example.com/image.jpg&width=800&quality=80" \\
  -H "Authorization: Bearer ${apiKey}"`,
    node: `const response = await fetch(
  "https://api.optstuff.dev/v1/optimize?url=https://example.com/image.jpg&width=800&quality=80",
  { headers: { Authorization: "Bearer ${apiKey}" } }
);`,
    python: `import requests

response = requests.get(
    "https://api.optstuff.dev/v1/optimize",
    params={"url": "https://example.com/image.jpg", "width": 800, "quality": 80},
    headers={"Authorization": f"Bearer ${apiKey}"}
)`,
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 rounded-t-lg border-b">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-colors",
              activeTab === tab.id
                ? "text-foreground border-foreground border-b-2"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="bg-muted/50 border-border group relative rounded-lg border p-3">
        <pre className="overflow-x-auto pr-10 text-xs">
          <code>{codeExamples[activeTab]}</code>
        </pre>
        <div className="absolute top-2 right-2">
          <CopyButton
            text={codeExamples[activeTab]}
            variant="secondary"
            size="icon"
            className="h-7 w-7 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
          />
        </div>
      </div>
    </div>
  );
}

export function DocsLink() {
  return (
    <a
      href="https://docs.optstuff.dev"
      target="_blank"
      rel="noopener noreferrer"
      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs transition-colors"
    >
      <ExternalLink className="h-3 w-3" />
      View full API documentation
    </a>
  );
}
