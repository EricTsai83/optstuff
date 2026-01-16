"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Label } from "@workspace/ui/components/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { CopyButton } from "./copy-button";

type ApiCodeExamplesProps = {
  readonly apiKey: string;
};

const generateCurlExample = (apiKey: string) =>
  `curl -X GET "https://api.optstuff.dev/v1/optimize?url=YOUR_IMAGE_URL&width=800&format=webp" \\
  -H "Authorization: Bearer ${apiKey}"`;

const generateTsExample = (apiKey: string) =>
  `const response = await fetch(
  "https://api.optstuff.dev/v1/optimize?" + new URLSearchParams({
    url: "YOUR_IMAGE_URL",
    width: "800",
    format: "webp",
  }),
  {
    headers: {
      Authorization: "Bearer ${apiKey}",
    },
  }
);

const optimizedImage = await response.blob();`;

export function ApiCodeExamples({ apiKey }: ApiCodeExamplesProps) {
  const [copied, setCopied] = useState<"curl" | "ts" | null>(null);

  const curlExample = generateCurlExample(apiKey);
  const tsExample = generateTsExample(apiKey);

  const handleCopy = (type: "curl" | "ts") => {
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div>
      <Label className="text-muted-foreground text-xs">Quick Start</Label>
      <Tabs defaultValue="curl" className="mt-2">
        <TabsList className="w-full">
          <TabsTrigger value="curl" className="flex-1">
            cURL
          </TabsTrigger>
          <TabsTrigger value="typescript" className="flex-1">
            TypeScript
          </TabsTrigger>
        </TabsList>
        <TabsContent value="curl" className="mt-2">
          <CodeBlock
            code={curlExample}
            copied={copied === "curl"}
            onCopy={() => handleCopy("curl")}
          />
        </TabsContent>
        <TabsContent value="typescript" className="mt-2">
          <CodeBlock
            code={tsExample}
            copied={copied === "ts"}
            onCopy={() => handleCopy("ts")}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type CodeBlockProps = {
  readonly code: string;
  readonly copied: boolean;
  readonly onCopy: () => void;
};

function CodeBlock({ code, onCopy }: CodeBlockProps) {
  return (
    <div className="relative">
      <pre className="bg-muted overflow-x-auto rounded-md p-3 text-xs">
        <code>{code}</code>
      </pre>
      <div className="absolute top-2 right-2">
        <CopyButton
          text={code}
          variant="ghost"
          size="icon"
          className="h-7 w-7"
        />
      </div>
    </div>
  );
}

export function DocsLink() {
  return (
    <div className="text-muted-foreground flex items-center justify-center gap-1 text-xs">
      <span>Need more help?</span>
      <a
        href="https://docs.optstuff.dev"
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary inline-flex items-center gap-1 hover:underline"
      >
        View full documentation
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
