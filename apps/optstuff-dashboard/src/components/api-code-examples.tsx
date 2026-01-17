"use client";

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
  const curlExample = generateCurlExample(apiKey);
  const tsExample = generateTsExample(apiKey);

  return (
    <div className="space-y-2">
      <Label className="text-muted-foreground text-xs tracking-wider uppercase">
        Quick Start
      </Label>
      <Tabs defaultValue="curl" className="w-full">
        <TabsList className="bg-muted/50 grid w-full grid-cols-2">
          <TabsTrigger
            value="curl"
            className="data-[state=active]:bg-background text-xs"
          >
            cURL
          </TabsTrigger>
          <TabsTrigger
            value="typescript"
            className="data-[state=active]:bg-background text-xs"
          >
            TypeScript
          </TabsTrigger>
        </TabsList>
        {/* Fixed height container to prevent layout shift */}
        <div className="relative mt-2 h-[140px]">
          <TabsContent value="curl" className="absolute inset-0 mt-0">
            <CodeBlock code={curlExample} />
          </TabsContent>
          <TabsContent value="typescript" className="absolute inset-0 mt-0">
            <CodeBlock code={tsExample} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function CodeBlock({ code }: { readonly code: string }) {
  return (
    <div className="group relative h-full">
      <pre className="bg-muted/50 border-border h-full overflow-auto rounded-lg border p-3 text-xs leading-relaxed">
        <code className="text-foreground/80">{code}</code>
      </pre>
      <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
        <CopyButton
          text={code}
          variant="secondary"
          size="icon"
          className="h-7 w-7 shadow-sm"
        />
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
      className="text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center justify-center gap-2 rounded-lg border border-dashed py-2.5 text-xs transition-colors"
    >
      <ExternalLink className="h-3.5 w-3.5" />
      View full documentation
    </a>
  );
}
