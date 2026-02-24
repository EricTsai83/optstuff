"use client";

import { env } from "@/env";
import { DOCS_LINKS } from "@/lib/constants";
import { CopyButton } from "@workspace/ui/components/copy-button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";

type Tab = "curl" | "node" | "python";

const TABS: { id: Tab; label: string }[] = [
  { id: "curl", label: "cURL" },
  { id: "node", label: "Node.js" },
  { id: "python", label: "Python" },
];

const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");

type ApiCodeExamplesProps = {
  readonly apiKey: string;
};

export function ApiCodeExamples({ apiKey }: ApiCodeExamplesProps) {
  const [activeTab, setActiveTab] = useState<Tab>("curl");

  const codeExamples = useMemo<Record<Tab, string>>(
    () => ({
      curl: `curl -X GET "${baseUrl}/api/v1/optimize?url=https://example.com/image.jpg&width=800&quality=80" \\
  -H "Authorization: Bearer ${apiKey}"`,
      node: `const response = await fetch(
  "${baseUrl}/api/v1/optimize?url=https://example.com/image.jpg&width=800&quality=80",
  { headers: { Authorization: "Bearer ${apiKey}" } }
);`,
      python: `import requests

response = requests.get(
    "${baseUrl}/api/v1/optimize",
    params={"url": "https://example.com/image.jpg", "width": 800, "quality": 80},
    headers={"Authorization": f"Bearer ${apiKey}"}
)`,
    }),
    [apiKey],
  );

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as Tab)}
      className="space-y-2"
    >
      <TabsList className="h-auto w-full justify-start gap-0 rounded-none rounded-t-lg border-b bg-transparent p-0">
        {TABS.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="data-[state=active]:border-foreground text-muted-foreground data-[state=active]:text-foreground rounded-none border-b-2 border-transparent px-3 py-1.5 text-xs font-medium shadow-none transition-colors data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {TABS.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="mt-0">
          <div className="bg-muted/50 border-border group relative rounded-lg border p-3">
            <pre className="overflow-x-auto pr-10 text-xs">
              <code>{codeExamples[tab.id]}</code>
            </pre>
            <div className="absolute right-2 top-2">
              <CopyButton
                text={codeExamples[tab.id]}
                className="bg-secondary h-7 w-7 rounded-md opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
              />
            </div>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}

export function DocsLink() {
  return (
    <a
      href={DOCS_LINKS.home}
      target="_blank"
      rel="noopener noreferrer"
      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs transition-colors"
    >
      <ExternalLink className="h-3 w-3" />
      View full API documentation
    </a>
  );
}
