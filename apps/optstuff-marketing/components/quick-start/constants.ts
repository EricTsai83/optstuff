import type { Step } from "./types";

export const STEPS: readonly Step[] = [
  {
    number: "1",
    title: "Create a Project, Copy Keys, Allow Sources",
    description:
      "Create your project, copy the API keys, and allow the image source domains you want to optimize.",
  },
  {
    number: "2",
    title: "Sign Image URLs in Your App",
    description:
      "Keep `sk_...` on the server, sign each image URL, and let OptStuff return the optimized result on request.",
  },
] as const;

export const CODE_EXAMPLES: Record<"signedUrl" | "server" | "headers", string> =
  {
    signedUrl: `https://images.example.com/api/v1/my-blog/
w_800,q_80,f_webp/
cdn.example.com/photo.jpg?
key=pk_abc123&sig=xyz789&exp=1706500000`,
    server: `import { createHmac } from "crypto";

const path = "w_800,q_80,f_webp/cdn.example.com/photo.jpg";
const exp = 1735689600;
const payload = \`\${path}?exp=\${exp}\`;

const sig = createHmac("sha256", process.env.OPTSTUFF_SECRET_KEY!)
  .update(payload)
  .digest("base64url")
  .substring(0, 32);

const url = new URL(
  \`/api/v1/my-blog/\${path}\`,
  "https://images.example.com",
);

url.search = new URLSearchParams({
  key: "pk_abc123",
  sig,
  exp: String(exp),
}).toString();`,
    headers: `HTTP/1.1 200 OK
Content-Type: image/webp
Cache-Control: public, s-maxage=31536000, max-age=31536000, immutable
Vary: Accept
X-Processing-Time: 42ms
X-Head-Fast-Path: 0
Server-Timing: auth;dur=7, transform;dur=35, total;dur=42`,
  };
