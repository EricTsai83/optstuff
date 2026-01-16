import type { Step } from "./types";

export const STEPS: readonly Step[] = [
  {
    number: "1",
    title: "Create a Project",
    description: "Sign up and create a project in your dashboard.",
  },
  {
    number: "2",
    title: "Get API Key",
    description: "Your project includes a default API key ready to use.",
  },
  {
    number: "3",
    title: "Start Optimizing",
    description: "Use the API to optimize images instantly.",
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
