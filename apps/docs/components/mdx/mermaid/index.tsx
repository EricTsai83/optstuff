"use client";

import { useTheme } from "next-themes";
import { Suspense, use, useEffect, useId, useState } from "react";
import { SvgViewer } from "../../svg-viewer";

const LOADING_DIAGRAM = (
  <div
    className="bg-fd-muted h-40 w-full animate-pulse rounded-lg"
    role="img"
    aria-label="Loading diagram"
  />
);

const promiseCache = new Map<string, Promise<unknown>>();

function getCachedPromise<T>(
  key: string,
  createPromise: () => Promise<T>,
): Promise<T> {
  const existing = promiseCache.get(key);
  if (existing) return existing as Promise<T>;

  const promise = createPromise();
  promiseCache.set(key, promise);
  return promise;
}

function useMermaidModule() {
  return use(getCachedPromise("mermaid-module", () => import("mermaid")))
    .default;
}

/**
 * Renders a Mermaid diagram from author-controlled MDX content.
 *
 * Lazily loads the Mermaid runtime after hydration and wraps the output in
 * an {@link SvgViewer} that provides inline preview + full-screen zoom/pan.
 *
 * @example
 * ```mdx
 * <Mermaid chart="graph TD; A-->B; B-->C;" />
 * ```
 */
export function Mermaid({ chart }: { readonly chart: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return LOADING_DIAGRAM;

  return (
    <Suspense fallback={LOADING_DIAGRAM}>
      <MermaidContent chart={chart} />
    </Suspense>
  );
}

/**
 * SECURITY: The `chart` prop is rendered as raw SVG via `dangerouslySetInnerHTML`
 * with mermaid's `securityLevel: "loose"`.
 *
 * This is safe **only** because `chart` content is author-controlled MDX — it is
 * never sourced from user input.
 *
 * If `chart` ever becomes user-supplied:
 *  1. Switch `securityLevel` to `"strict"` or `"sandbox"`.
 *  2. Remove `dangerouslySetInnerHTML` and use a sandboxed iframe or DOMPurify.
 *  3. Validate / sanitize the Mermaid markup before rendering.
 */
function MermaidContent({ chart }: { readonly chart: string }) {
  const id = useId();
  const { resolvedTheme } = useTheme();
  const mermaid = useMermaidModule();
  const theme = resolvedTheme === "dark" ? "dark" : "default";

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    fontFamily: "inherit",
    themeCSS: "margin: 1.5rem auto 0;",
    theme,
  });

  const { svg, bindFunctions } = use(
    getCachedPromise(`${theme}:${chart}`, () => {
      return mermaid.render(id, chart.replaceAll("\\n", "\n"));
    }),
  );

  return (
    <SvgViewer
      svgHtml={svg}
      title="Mermaid Diagram"
      bindFunctions={bindFunctions}
    />
  );
}
