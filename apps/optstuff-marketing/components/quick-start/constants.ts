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

export const CODE_EXAMPLES: Record<"curl" | "js" | "response", string> = {
  curl: `curl "https://api.optstuff.dev/v1/optimize?\\
  url=https://example.com/hero.png&\\
  width=800&format=webp" \\
  -H "Authorization: Bearer sk_live_xxx"`,
  js: `const response = await fetch(
  "https://api.optstuff.dev/v1/optimize?" +
  new URLSearchParams({
    url: "https://example.com/hero.png",
    width: "800",
    format: "webp"
  }),
  { headers: { Authorization: "Bearer sk_live_xxx" } }
);`,
  response: `{
  "success": true,
  "data": {
    "url": "https://cdn.optstuff.dev/optimized/abc123.webp",
    "originalSize": 2457600,
    "optimizedSize": 190464,
    "savings": "92%"
  }
}`,
};
