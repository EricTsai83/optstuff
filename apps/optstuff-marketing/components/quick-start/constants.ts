import type { Step } from "./types";

export const STEPS: readonly Step[] = [
  {
    number: "1",
    title: "Create a Project & Get API Keys",
    description:
      "Sign up, create a project, and get your secret and public keys.",
  },
  {
    number: "2",
    title: "Start Optimizing",
    description:
      "Prefix the remote image URL (no protocol) with our optimization endpoint to get the optimized URL.",
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
