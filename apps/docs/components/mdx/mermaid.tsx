"use client";

import { useTheme } from "next-themes";
import {
  Suspense,
  use,
  useEffect,
  useId,
  useRef,
  useState,
  type WheelEvent,
} from "react";

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

export function Mermaid({ chart }: { readonly chart: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="bg-fd-muted h-40 w-full animate-pulse rounded-lg"
        role="img"
        aria-label="Loading diagram"
      />
    );
  }

  return (
    <Suspense
      fallback={
        <div
          className="bg-fd-muted h-40 w-full animate-pulse rounded-lg"
          role="img"
          aria-label="Loading diagram"
        />
      }
    >
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
  const modalId = useId();
  const { resolvedTheme } = useTheme();
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const zoomViewportRef = useRef<HTMLDivElement | null>(null);
  const zoomChartRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
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

  useEffect(() => {
    if (!isZoomOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsZoomOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isZoomOpen]);

  useEffect(() => {
    if (isZoomOpen) {
      closeButtonRef.current?.focus();
      return;
    }

    previouslyFocusedElementRef.current?.focus();
  }, [isZoomOpen]);

  useEffect(() => {
    if (!isZoomOpen) return;

    const frameId = window.requestAnimationFrame(() => {
      const viewport = zoomViewportRef.current;
      const chartContainer = zoomChartRef.current;

      if (!viewport || !chartContainer) return;

      const viewportWidth = viewport.clientWidth;
      const viewportHeight = viewport.clientHeight;
      const chartWidth = chartContainer.scrollWidth;
      const chartHeight = chartContainer.scrollHeight;

      if (!viewportWidth || !viewportHeight || !chartWidth || !chartHeight) {
        return;
      }

      const fitScale = Math.min(
        viewportWidth / chartWidth,
        viewportHeight / chartHeight,
      );
      const nextZoom = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, Number(fitScale.toFixed(2))),
      );
      setZoom(nextZoom);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [isZoomOpen, svg]);

  const clampZoom = (value: number) => {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(value.toFixed(2))));
  };

  const decreaseZoom = () => {
    setZoom((prev) => clampZoom(prev - ZOOM_STEP));
  };

  const increaseZoom = () => {
    setZoom((prev) => clampZoom(prev + ZOOM_STEP));
  };

  const openZoomView = () => {
    const activeElement = document.activeElement;
    previouslyFocusedElementRef.current =
      activeElement instanceof HTMLElement ? activeElement : null;
    setZoom(1);
    setIsZoomOpen(true);
  };

  const handleWheelZoom = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const dominantDelta =
      Math.abs(event.deltaY) >= Math.abs(event.deltaX)
        ? event.deltaY
        : event.deltaX;
    const nextDelta = dominantDelta < 0 ? ZOOM_STEP : -ZOOM_STEP;
    setZoom((prev) => clampZoom(prev + nextDelta));
  };

  return (
    <>
      <div className="border-fd-border bg-fd-card my-6 rounded-xl border p-4">
        <div className="mb-3 flex items-center justify-end">
          <button
            type="button"
            onClick={openZoomView}
            className="border-fd-border text-fd-muted-foreground hover:bg-fd-muted cursor-pointer rounded-md border px-3 py-1.5 text-xs font-medium transition"
          >
            Open Zoom
          </button>
        </div>
        <div
          className="overflow-x-auto"
          ref={(container) => {
            if (container) bindFunctions?.(container);
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      {isZoomOpen ? (
        <div
          className="z-100 fixed inset-0 bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={modalId}
          onClick={() => setIsZoomOpen(false)}
        >
          <div
            className="border-fd-border bg-fd-background mx-auto flex h-full w-full max-w-7xl flex-col rounded-xl border shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-fd-border flex items-center justify-between gap-2 border-b px-4 py-3">
              <p id={modalId} className="text-sm font-medium">
                Mermaid Diagram
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={decreaseZoom}
                  className="border-fd-border hover:bg-fd-muted cursor-pointer rounded-md border px-2 py-1 text-sm transition"
                  aria-label="Zoom out diagram"
                >
                  -
                </button>
                <span className="text-fd-muted-foreground w-14 text-center text-xs">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={increaseZoom}
                  className="border-fd-border hover:bg-fd-muted cursor-pointer rounded-md border px-2 py-1 text-sm transition"
                  aria-label="Zoom in diagram"
                >
                  +
                </button>
                <button
                  type="button"
                  ref={closeButtonRef}
                  onClick={() => setIsZoomOpen(false)}
                  className="border-fd-border hover:bg-fd-muted cursor-pointer rounded-md border px-3 py-1 text-xs transition"
                >
                  Close
                </button>
              </div>
            </div>
            <div
              className="flex-1 overflow-auto p-4"
              onWheel={handleWheelZoom}
              ref={zoomViewportRef}
            >
              <div
                className="mx-auto w-max origin-top transition-transform"
                style={{ transform: `scale(${zoom})` }}
                ref={(container) => {
                  zoomChartRef.current = container;
                  if (container) bindFunctions?.(container);
                }}
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
