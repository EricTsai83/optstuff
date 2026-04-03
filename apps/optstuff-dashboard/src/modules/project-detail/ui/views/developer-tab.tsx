import { env } from "@/env";
import { highlightCode } from "@/lib/highlight-code";
import type { Project } from "../../types";
import {
  DeveloperSnippets,
  type Framework,
} from "../components/developer-snippets";
import { UrlTester } from "../components/url-tester";

type DeveloperTabProps = {
  readonly project: Project;
};

type SnippetDef = {
  readonly id: string;
  readonly label: string;
  readonly lang: string;
  readonly code: string;
};

type FrameworkDef = {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly snippets: readonly SnippetDef[];
};

function getFrameworkDefs(
  projectSlug: string,
  apiEndpoint: string,
): readonly FrameworkDef[] {
  return [
    {
      id: "nextjs",
      label: "Next.js",
      icon: "▲",
      snippets: [
        {
          id: "env",
          label: ".env",
          lang: "bash",
          code: `# Add to your .env file (server-side only - keep secret!)
OPTSTUFF_SECRET_KEY="sk_your_secret_key_here"  # From API Key creation
OPTSTUFF_PUBLIC_KEY="pk_abc123..."  # From API Key creation

# Public config
NEXT_PUBLIC_OPTSTUFF_PROJECT_SLUG="${projectSlug}"
NEXT_PUBLIC_OPTSTUFF_ENDPOINT="${apiEndpoint}"  # Your deployment URL`,
        },
        {
          id: "loader",
          label: "optstuff.ts",
          lang: "typescript",
          code: `// lib/optstuff.ts (SERVER-SIDE ONLY)
import crypto from "crypto";

const SECRET_KEY = process.env.OPTSTUFF_SECRET_KEY!;
const PUBLIC_KEY = process.env.OPTSTUFF_PUBLIC_KEY!;
const ENDPOINT = process.env.NEXT_PUBLIC_OPTSTUFF_ENDPOINT!;  // Your deployment URL + /api/v1
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
    exp = effectiveBucket > 0
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
    bucketSeconds: 3600,  // same hour => same URL => better cache reuse
  });

  return Response.json({ url: signedUrl });
}`,
        },
        {
          id: "usage",
          label: "page.tsx",
          lang: "tsx",
          code: `// Using signed URLs in Next.js
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
async function getOptimizedUrl(imageSrc: string) {
  const response = await fetch(\`/api/image-url?src=\${imageSrc}&w=800\`);
  const { url } = await response.json();
  return url as string;
}`,
        },
      ],
    },
    {
      id: "typescript",
      label: "TypeScript",
      icon: "TS",
      snippets: [
        {
          id: "env",
          label: ".env",
          lang: "bash",
          code: `# Server-side only — keep secret!
OPTSTUFF_SECRET_KEY="sk_your_secret_key_here"
OPTSTUFF_PUBLIC_KEY="pk_abc123..."
OPTSTUFF_PROJECT_SLUG="${projectSlug}"
OPTSTUFF_BASE_URL="${apiEndpoint}"`,
        },
        {
          id: "sign",
          label: "optstuff.ts",
          lang: "typescript",
          code: `import { createHmac } from "crypto";

const SECRET_KEY = process.env.OPTSTUFF_SECRET_KEY!;
const PUBLIC_KEY = process.env.OPTSTUFF_PUBLIC_KEY!;
const BASE_URL = process.env.OPTSTUFF_BASE_URL!;
const PROJECT_SLUG = process.env.OPTSTUFF_PROJECT_SLUG || "${projectSlug}";

export function signImageUrl(
  imageUrl: string,
  operations = "_",
  expiresIn?: number,
): string {
  const path = \`\${operations}/\${imageUrl}\`;
  const exp = expiresIn
    ? Math.floor(Date.now() / 1000) + expiresIn
    : undefined;

  const payload = exp ? \`\${path}?exp=\${exp}\` : path;
  const sig = createHmac("sha256", SECRET_KEY)
    .update(payload)
    .digest("base64url")
    .substring(0, 32);

  const params = new URLSearchParams({ key: PUBLIC_KEY, sig });
  if (exp) params.set("exp", String(exp));

  return \`\${BASE_URL}/\${PROJECT_SLUG}/\${path}?\${params}\`;
}`,
        },
        {
          id: "usage",
          label: "example.ts",
          lang: "typescript",
          code: `import { signImageUrl } from "./optstuff";

// Basic usage — no expiration
const url = signImageUrl("images.example.com/photo.jpg", "w_800,f_webp");
console.log(url);

// With expiration (1 hour)
const temporary = signImageUrl(
  "images.example.com/photo.jpg",
  "w_800,q_80,f_avif",
  3600,
);
console.log(temporary);

// HTTP server example (Node.js built-in)
import { createServer } from "http";

createServer((req, res) => {
  const { searchParams } = new URL(req.url!, \`http://\${req.headers.host}\`);
  const src = searchParams.get("src");
  if (!src) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Missing src" }));
    return;
  }

  const w = searchParams.get("w");
  const f = searchParams.get("f") ?? "webp";
  const ops = [w && \`w_\${w}\`, \`f_\${f}\`].filter(Boolean).join(",");

  const signed = signImageUrl(src, ops || "_", 3600);
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ url: signed }));
}).listen(3000);`,
        },
      ],
    },
  ];
}

async function buildFrameworks(
  defs: readonly FrameworkDef[],
): Promise<Framework[]> {
  return Promise.all(
    defs.map(async ({ id, label, icon, snippets }) => ({
      id,
      label,
      icon,
      tabs: await Promise.all(
        snippets.map(async ({ id: tabId, label: tabLabel, lang, code }) => ({
          id: tabId,
          label: tabLabel,
          lang,
          raw: code,
          html: await highlightCode(code, lang),
        })),
      ),
    })),
  );
}

export async function DeveloperTab({ project }: DeveloperTabProps) {
  const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  const apiEndpoint = `${baseUrl}/api/v1`;
  const frameworks = await buildFrameworks(
    getFrameworkDefs(project.slug, apiEndpoint),
  );

  return (
    <div className="space-y-6">
      <DeveloperSnippets frameworks={frameworks} />
      <UrlTester
        projectId={project.id}
        projectSlug={project.slug}
        apiEndpoint={apiEndpoint}
      />
    </div>
  );
}
