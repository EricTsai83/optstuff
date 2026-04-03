"use client";

import { useTheme } from "next-themes";
import { Suspense, use, useId, useSyncExternalStore } from "react";
import { SvgViewer } from "./svg-viewer";

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

const subscribeToNothing = () => () => {};

/** SSR / hydration-safe client gate without `useEffect` + `setState`. */
function useIsClient() {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}

export type MermaidProps = {
  readonly chart: string;
  /** Short figure title (code fence `title="..."`), not the page frontmatter title. */
  readonly title?: string;
  /** Optional reading note for the preview toolbar (code fence `caption="..."`). */
  readonly caption?: string;
};

/**
 * Renders a Mermaid diagram from author-controlled MDX content.
 *
 * Lazily loads the Mermaid runtime after hydration and wraps the output in
 * an {@link SvgViewer} that provides inline preview + full-screen zoom/pan.
 *
 * Map as `Mermaid` in MDX `components`; code fences are transformed by
 * {@link remarkMdxMermaidWithTitle} in `source.config.ts`.
 */
export function Mermaid({ chart, title, caption }: MermaidProps) {
  const mounted = useIsClient();

  return (
    <div className="my-6">
      {!mounted ? (
        LOADING_DIAGRAM
      ) : (
        <Suspense fallback={LOADING_DIAGRAM}>
          <MermaidContent chart={chart} title={title} caption={caption} />
        </Suspense>
      )}
    </div>
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
function MermaidContent({ chart, title, caption }: MermaidProps) {
  const id = useId();
  const { resolvedTheme } = useTheme();
  const mermaid = useMermaidModule();
  const theme = resolvedTheme === "dark" ? "dark" : "default";
  const normalizedChart = chart.replaceAll("\\n", "\n");
  const renderKey = `${theme}:${id}`;
  const cacheKey = `${renderKey}:${normalizedChart}`;

  const { svg, bindFunctions } = use(
    getCachedPromise(cacheKey, () => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "loose",
        fontFamily: "inherit",
        themeCSS: "margin: 1.5rem auto 0;",
        theme,
      });
      return mermaid.render(id, normalizedChart);
    }),
  );

  return (
    <SvgViewer
      svgHtml={svg}
      title={title}
      previewDescription={caption}
      bindFunctions={bindFunctions}
    />
  );
}
