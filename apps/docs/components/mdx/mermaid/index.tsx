"use client";

import { useTheme } from "next-themes";
import { Suspense, use, useEffect, useId, useRef, useState } from "react";
import { FullScreenViewer } from "./full-screen-viewer";
import { MermaidPreview } from "./mermaid-preview";

const LOADING_DIAGRAM = (
  <div
    className="bg-fd-muted h-40 w-full animate-pulse rounded-lg"
    role="img"
    aria-label="Loading diagram"
  />
);

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

const cache = new Map<string, Promise<unknown>>();

function cachePromise<T>(
  key: string,
  setPromise: () => Promise<T>,
): Promise<T> {
  const cached = cache.get(key);
  if (cached) return cached as Promise<T>;

  const promise = setPromise();
  cache.set(key, promise);
  return promise;
}

/**
 * SECURITY: The `chart` prop is rendered as raw SVG via `dangerouslySetInnerHTML`
 * (see the returned JSX below) with mermaid's `securityLevel: "loose"`.
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
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  const { default: mermaid } = use(
    cachePromise("mermaid", () => import("mermaid")),
  );

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    fontFamily: "inherit",
    themeCSS: "margin: 1.5rem auto 0;",
    theme: resolvedTheme === "dark" ? "dark" : "default",
  });

  const { svg, bindFunctions } = use(
    cachePromise(`${chart}-${resolvedTheme}`, () => {
      return mermaid.render(id, chart.replaceAll("\\n", "\n"));
    }),
  );

  const openFullScreen = () => {
    const el = document.activeElement;
    prevFocusRef.current = el instanceof HTMLElement ? el : null;
    setIsZoomOpen(true);
  };

  const closeFullScreen = () => {
    setIsZoomOpen(false);
    prevFocusRef.current?.focus();
  };

  return (
    <>
      <MermaidPreview
        svgHtml={svg}
        onOpenFullScreen={openFullScreen}
        bindFunctions={bindFunctions}
      />

      {isZoomOpen ? (
        <FullScreenViewer
          svgHtml={svg}
          onClose={closeFullScreen}
          bindFunctions={bindFunctions}
        />
      ) : null}
    </>
  );
}
