"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { CopyButton } from "./copy-button";

type DeveloperSnippetsProps = {
  readonly projectSlug: string;
  readonly apiEndpoint: string;
};

export function DeveloperSnippets({
  projectSlug,
  apiEndpoint,
}: DeveloperSnippetsProps) {
  const envExample = `# Add to your .env or .env.local file
NEXT_PUBLIC_IPX_PROJECT_SLUG="${projectSlug}"
NEXT_PUBLIC_IPX_ENDPOINT="${apiEndpoint}"`;

  const loaderExample = `// lib/image-loader.ts
import type { ImageLoaderProps } from "next/image";

const IPX_ENDPOINT = process.env.NEXT_PUBLIC_IPX_ENDPOINT || "${apiEndpoint}";
const PROJECT_SLUG = process.env.NEXT_PUBLIC_IPX_PROJECT_SLUG || "${projectSlug}";

/**
 * Custom image loader for Next.js that uses IPX optimization service
 */
export function ipxLoader({ src, width, quality }: ImageLoaderProps): string {
  // Build operations string
  const operations = [];
  if (width) operations.push(\`w_\${width}\`);
  if (quality) operations.push(\`q_\${quality}\`);
  operations.push("f_webp"); // Auto format to WebP
  
  const opsString = operations.length > 0 ? operations.join(",") : "_";
  
  // Remove protocol from src if present
  const imagePath = src.replace(/^https?:\\/\\//, "");
  
  return \`\${IPX_ENDPOINT}/\${PROJECT_SLUG}/\${opsString}/\${imagePath}\`;
}`;

  const usageExample = `// Using the loader in Next.js
import Image from "next/image";
import { ipxLoader } from "@/lib/image-loader";

export function MyImage() {
  return (
    <Image
      loader={ipxLoader}
      src="images.example.com/photo.jpg"
      width={800}
      height={600}
      alt="Optimized image"
    />
  );
}`;

  const directUrlExample = `<!-- Direct URL usage in HTML -->
<img 
  src="${apiEndpoint}/${projectSlug}/w_800,f_webp,q_80/images.example.com/photo.jpg" 
  alt="Optimized image"
/>

<!-- URL Format -->
${apiEndpoint}/{projectSlug}/{operations}/{imageUrl}

<!-- Operations Examples -->
w_800        → Width 800px
h_600        → Height 600px
s_800x600    → Size 800x600
q_80         → Quality 80%
f_webp       → Format WebP
f_avif       → Format AVIF
_            → No operations (passthrough)`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
          <CardDescription>
            Copy these code snippets to integrate IPX into your project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="env" className="w-full">
            <TabsList className="mb-4 grid w-full grid-cols-4">
              <TabsTrigger value="env">.env</TabsTrigger>
              <TabsTrigger value="loader">Loader</TabsTrigger>
              <TabsTrigger value="usage">Usage</TabsTrigger>
              <TabsTrigger value="direct">Direct URL</TabsTrigger>
            </TabsList>

            <TabsContent value="env">
              <div className="relative">
                <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-sm">
                  <code>{envExample}</code>
                </pre>
                <div className="absolute top-2 right-2">
                  <CopyButton text={envExample} variant="secondary" size="sm" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="loader">
              <div className="relative">
                <pre className="bg-muted max-h-[400px] overflow-auto rounded-lg p-4 text-sm">
                  <code>{loaderExample}</code>
                </pre>
                <div className="absolute top-2 right-2">
                  <CopyButton
                    text={loaderExample}
                    variant="secondary"
                    size="sm"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="usage">
              <div className="relative">
                <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-sm">
                  <code>{usageExample}</code>
                </pre>
                <div className="absolute top-2 right-2">
                  <CopyButton
                    text={usageExample}
                    variant="secondary"
                    size="sm"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="direct">
              <div className="relative">
                <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-sm">
                  <code>{directUrlExample}</code>
                </pre>
                <div className="absolute top-2 right-2">
                  <CopyButton
                    text={directUrlExample}
                    variant="secondary"
                    size="sm"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
