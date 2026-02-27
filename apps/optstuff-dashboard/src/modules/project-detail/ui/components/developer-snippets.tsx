"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { CopyButton } from "@workspace/ui/components/copy-button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";

type DeveloperSnippetsProps = {
  readonly projectSlug: string;
  readonly apiEndpoint: string;
};

/**
 * Render a tabbed "Quick Start" card with ready-to-copy code snippets for integrating OptStuff.
 *
 * @param projectSlug - Project identifier inserted into the displayed snippets (e.g., NEXT_PUBLIC_OPTSTUFF_PROJECT_SLUG).
 * @param apiEndpoint - Deployment endpoint inserted into the displayed snippets (used for signed URL examples).
 * @returns A React element containing a card with four tabs (.env, Loader, Usage, Direct URL), each showing a code example and a copy button.
 */
export function DeveloperSnippets({
  projectSlug,
  apiEndpoint,
}: DeveloperSnippetsProps) {
  const envExample = `# Add to your .env file (server-side only - keep secret!)
OPTSTUFF_SECRET_KEY="sk_your_secret_key_here"  # From API Key creation
OPTSTUFF_PUBLIC_KEY="pk_abc123..."             # From API Key creation

# Public config
NEXT_PUBLIC_OPTSTUFF_PROJECT_SLUG="${projectSlug}"
NEXT_PUBLIC_OPTSTUFF_ENDPOINT="${apiEndpoint}"  # Your deployment URL`;

  const loaderExample = `// lib/optstuff.ts (SERVER-SIDE ONLY)
import crypto from "crypto";

const SECRET_KEY = process.env.OPTSTUFF_SECRET_KEY!;
const PUBLIC_KEY = process.env.OPTSTUFF_PUBLIC_KEY!;
const ENDPOINT = process.env.NEXT_PUBLIC_OPTSTUFF_ENDPOINT!; // Your deployment URL + /api/v1
const PROJECT_SLUG = process.env.NEXT_PUBLIC_OPTSTUFF_PROJECT_SLUG || "${projectSlug}";

/**
 * Sign an image URL with HMAC-SHA256
 * Call this from your API route or server component
 */
export function signImageUrl(
  imagePath: string,
  operations: string = "_",
  options?: {
    ttlSeconds?: number;
    /**
     * Round expiration into fixed buckets so repeated renders generate
     * identical URLs (better CDN/browser cache hit ratio).
     */
    bucketSeconds?: number;
  }
): string {
  const path = \`\${operations}/\${imagePath}\`;
  const now = Math.floor(Date.now() / 1000);
  const ttlSeconds = options?.ttlSeconds;
  const bucketSeconds = options?.bucketSeconds;
  let exp: number | undefined;
  if (ttlSeconds && ttlSeconds > 0) {
    const rawExp = now + ttlSeconds;
    const effectiveBucket = bucketSeconds && bucketSeconds > 0
      ? Math.min(bucketSeconds, ttlSeconds)
      : 0;
    exp = effectiveBucket > 0 && effectiveBucket <= ttlSeconds
      ? Math.ceil(rawExp / effectiveBucket) * effectiveBucket
      : rawExp;
  }
  
  const payload = exp ? \`\${path}?exp=\${exp}\` : path;
  const sig = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(payload)
    .digest("base64url")
    .substring(0, 32);
  
  let url = \`\${ENDPOINT}/\${PROJECT_SLUG}/\${path}?key=\${PUBLIC_KEY}&sig=\${sig}\`;
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
  const signedUrl = signImageUrl(src, ops, {
    ttlSeconds: 3600,
    bucketSeconds: 3600, // same hour => same URL => better cache reuse
  });
  
  return Response.json({ url: signedUrl });
}`;

  const usageExample = `// Using signed URLs in Next.js
// Option 1: Server Component (recommended)
import { signImageUrl } from "@/lib/optstuff";

export default function MyPage() {
  // Sign URL on server
  const imageUrl = signImageUrl(
    "images.example.com/photo.jpg",
    "w_800,f_webp",
    {
      ttlSeconds: 3600,
      bucketSeconds: 3600,
    }
  );

  return <img src={imageUrl} alt="Optimized image" />;
}

// Option 2: API Route + Client Fetch
// Create /api/image-url route, then fetch from client:
const response = await fetch(\`/api/image-url?src=\${imageSrc}&w=800\`);
const { url } = await response.json();`;

  const directUrlExample = `<!-- Signed URL Format -->
${apiEndpoint}/${projectSlug}/{operations}/{imageUrl}?key={publicKey}&sig={signature}&exp={expiry}

<!-- Example Signed URL -->
${apiEndpoint}/${projectSlug}/w_800,f_webp/images.example.com/photo.jpg?key=pk_abc123...&sig=xyz789&exp=1706500000

<!-- URL Parameters -->
key      → Public Key (from dashboard)
sig      → HMAC-SHA256 signature
exp      → (optional) Expiration timestamp

<!-- Operations Examples -->
w_800        → Width 800px
h_600        → Height 600px
s_800x600    → Size 800x600
q_80         → Quality 80%
f_webp       → Format WebP
f_avif       → Format AVIF
fit_cover    → Crop to fill dimensions
fit_contain  → Scale to fit within dimensions
fit_fill     → Stretch to fill exact dimensions
embed        → Embed mode
_            → No operations`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
          <CardDescription>
            Copy these code snippets to integrate OptStuff into your project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="env" className="w-full">
            <TabsList className="mb-4 grid w-full grid-cols-2 sm:grid-cols-4">
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
                <div className="absolute right-2 top-2">
                  <CopyButton
                    text={envExample}
                    className="bg-secondary h-8 w-8 rounded-md"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="loader">
              <div className="relative">
                <pre className="bg-muted max-h-[400px] overflow-auto rounded-lg p-4 text-sm">
                  <code>{loaderExample}</code>
                </pre>
                <div className="absolute right-2 top-2">
                  <CopyButton
                    text={loaderExample}
                    className="bg-secondary h-8 w-8 rounded-md"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="usage">
              <div className="relative">
                <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-sm">
                  <code>{usageExample}</code>
                </pre>
                <div className="absolute right-2 top-2">
                  <CopyButton
                    text={usageExample}
                    className="bg-secondary h-8 w-8 rounded-md"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="direct">
              <div className="relative">
                <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-sm">
                  <code>{directUrlExample}</code>
                </pre>
                <div className="absolute right-2 top-2">
                  <CopyButton
                    text={directUrlExample}
                    className="bg-secondary h-8 w-8 rounded-md"
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
