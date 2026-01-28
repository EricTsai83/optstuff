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
  const envExample = `# Add to your .env file (server-side only - keep secret!)
IPX_SECRET_KEY="sk_your_secret_key_here"  # From API Key creation
IPX_KEY_PREFIX="pk_abc123..."              # From API Key creation

# Public config
NEXT_PUBLIC_IPX_PROJECT_SLUG="${projectSlug}"
NEXT_PUBLIC_IPX_ENDPOINT="${apiEndpoint}"`;

  const loaderExample = `// lib/ipx-signer.ts (SERVER-SIDE ONLY)
import crypto from "crypto";

const SECRET_KEY = process.env.IPX_SECRET_KEY!;
const KEY_PREFIX = process.env.IPX_KEY_PREFIX!;
const IPX_ENDPOINT = process.env.NEXT_PUBLIC_IPX_ENDPOINT || "${apiEndpoint}";
const PROJECT_SLUG = process.env.NEXT_PUBLIC_IPX_PROJECT_SLUG || "${projectSlug}";

/**
 * Sign an IPX URL with HMAC-SHA256
 * Call this from your API route or server component
 */
export function signIpxUrl(
  imagePath: string,
  operations: string = "_",
  expiresIn?: number // seconds from now
): string {
  const path = \`\${operations}/\${imagePath}\`;
  const exp = expiresIn ? Math.floor(Date.now() / 1000) + expiresIn : undefined;
  
  const payload = exp ? \`\${path}?exp=\${exp}\` : path;
  const sig = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(payload)
    .digest("base64url")
    .substring(0, 32);
  
  let url = \`\${IPX_ENDPOINT}/\${PROJECT_SLUG}/\${path}?key=\${KEY_PREFIX}&sig=\${sig}\`;
  if (exp) url += \`&exp=\${exp}\`;
  
  return url;
}

// Example usage in API route:
// GET /api/image-url?src=images.example.com/photo.jpg&w=800
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const src = searchParams.get("src")!;
  const width = searchParams.get("w");
  
  const ops = width ? \`w_\${width},f_webp\` : "f_webp";
  const signedUrl = signIpxUrl(src, ops, 3600); // 1 hour expiry
  
  return Response.json({ url: signedUrl });
}`;

  const usageExample = `// Using signed URLs in Next.js
// Option 1: Server Component (recommended)
import { signIpxUrl } from "@/lib/ipx-signer";

export default function MyPage() {
  // Sign URL on server
  const imageUrl = signIpxUrl(
    "images.example.com/photo.jpg",
    "w_800,f_webp",
    3600 // 1 hour
  );

  return <img src={imageUrl} alt="Optimized image" />;
}

// Option 2: API Route + Client Fetch
// Create /api/image-url route, then fetch from client:
const response = await fetch(\`/api/image-url?src=\${imageSrc}&w=800\`);
const { url } = await response.json();`;

  const directUrlExample = `<!-- Signed URL Format -->
${apiEndpoint}/${projectSlug}/{operations}/{imageUrl}?key={keyPrefix}&sig={signature}&exp={expiry}

<!-- Example Signed URL -->
${apiEndpoint}/${projectSlug}/w_800,f_webp/images.example.com/photo.jpg?key=pk_abc123&sig=xyz789&exp=1706500000

<!-- URL Parameters -->
key      → API Key prefix (from dashboard)
sig      → HMAC-SHA256 signature
exp      → (optional) Expiration timestamp

<!-- Operations Examples -->
w_800        → Width 800px
h_600        → Height 600px
s_800x600    → Size 800x600
q_80         → Quality 80%
f_webp       → Format WebP
f_avif       → Format AVIF
_            → No operations`;

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
