"use client";

import { buttonVariants } from "fumadocs-ui/components/ui/button";
import { Info, Maximize2, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";
import type { PointerEvent, ReactNode, RefObject } from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;
/** Fullscreen auto-fit: extra inset (px) from viewport edges. */
const FULLSCREEN_FIT_PADDING = 56;
/** Fullscreen auto-fit: multiply fitted scale so the figure stays slightly smaller than edge-to-edge. */
const FULLSCREEN_FIT_HEADROOM = 0.88;

/** Client-space coords for multi-touch pinch + pan. */
type PointerClient = { readonly cx: number; readonly cy: number };

function parseSvgLength(value: string | null): number | null {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized || normalized.endsWith("%")) return null;
  const match = normalized.match(/^([0-9]*\.?[0-9]+)(px)?$/i);
  if (!match) return null;
  const parsed = Number.parseFloat(match[1] ?? "");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function getSvgIntrinsicSize(
  svg: SVGSVGElement,
): { width: number; height: number } | null {
  const viewBox = svg.viewBox?.baseVal;
  if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
    return { width: viewBox.width, height: viewBox.height };
  }

  const width = parseSvgLength(svg.getAttribute("width"));
  const height = parseSvgLength(svg.getAttribute("height"));
  if (width && height) return { width, height };

  return null;
}

function pinchMetricsFromMap(
  map: Map<number, PointerClient>,
  rect: DOMRectReadOnly,
): { dist: number; midX: number; midY: number } | null {
  if (map.size < 2) return null;
  const [a, b] = [...map.values()];
  if (!a || !b) return null;
  const x1 = a.cx - rect.left;
  const y1 = a.cy - rect.top;
  const x2 = b.cx - rect.left;
  const y2 = b.cy - rect.top;
  const dist = Math.hypot(x2 - x1, y2 - y1);
  return {
    dist,
    midX: (x1 + x2) / 2,
    midY: (y1 + y2) / 2,
  };
}

type ZoomActions = {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
};

function ZoomableViewport({
  children,
  actionsRef,
  className,
  wheelZoomEnabled = true,
  showFrame = true,
  /** Fill the viewport height and flex-center the SVG (fullscreen). Inline preview keeps content-height. */
  centerInViewport = false,
  /** Allow single-pointer panning. Touch input can disable drag while keeping pinch zoom. */
  panEnabled = true,
  /** Allow two-finger pinch zoom. Inline preview can disable it to stay read-only. */
  pinchZoomEnabled = true,
}: {
  readonly children: ReactNode;
  readonly actionsRef: RefObject<ZoomActions | null>;
  readonly className?: string;
  /** When false, wheel events are not captured so the page can scroll past the diagram. */
  readonly wheelZoomEnabled?: boolean;
  /** When false, omit border/radius so a parent card can wrap header + viewport as one unit. */
  readonly showFrame?: boolean;
  readonly centerInViewport?: boolean;
  readonly panEnabled?: boolean;
  readonly pinchZoomEnabled?: boolean;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({
    scale: 1,
    translateX: 0,
    translateY: 0,
  });
  const draggingRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const activePointersRef = useRef(new Map<number, PointerClient>());
  const pinchLastDistRef = useRef<number | null>(null);

  const applyTransform = useCallback(() => {
    const el = innerRef.current;
    if (!el) return;
    const { scale, translateX, translateY } = stateRef.current;
    el.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  }, []);

  /** Pan so the diagram center matches the viewport center (toolbar zoom feels anchored to the figure). */
  const recenterContent = useCallback(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const svg = inner.querySelector("svg");
    if (!svg) return;
    const outerRect = outer.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();
    const svgMidX = svgRect.left - outerRect.left + svgRect.width / 2;
    const svgMidY = svgRect.top - outerRect.top + svgRect.height / 2;
    const wantX = outerRect.width / 2;
    const wantY = outerRect.height / 2;
    const state = stateRef.current;
    state.translateX += wantX - svgMidX;
    state.translateY += wantY - svgMidY;
    applyTransform();
  }, [applyTransform]);

  const clampScale = useCallback(
    (s: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, s)),
    [],
  );

  /**
   * Fullscreen: scale diagram so it fits the viewport (can upscale past 1x),
   * anchored to the viewport center (same convention as toolbar zoom).
   */
  const fitContentToViewport = useCallback(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const svg = inner.querySelector("svg");
    if (!svg) return;

    const state = stateRef.current;
    state.scale = 1;
    state.translateX = 0;
    state.translateY = 0;
    applyTransform();

    const rect = outer.getBoundingClientRect();
    const intrinsicSize = getSvgIntrinsicSize(svg);
    const svgRect = svg.getBoundingClientRect();
    const svgW = intrinsicSize?.width ?? svgRect.width;
    const svgH = intrinsicSize?.height ?? svgRect.height;
    if (svgW < 4 || svgH < 4) return;

    const availW = Math.max(1, rect.width - FULLSCREEN_FIT_PADDING);
    const availH = Math.max(1, rect.height - FULLSCREEN_FIT_PADDING);
    const rawFit = Math.min(availW / svgW, availH / svgH);
    const newScale = clampScale(rawFit * FULLSCREEN_FIT_HEADROOM);

    const cx = rect.width / 2;
    const cy = rect.height / 2;
    state.scale = newScale;
    state.translateX = cx - cx * newScale;
    state.translateY = cy - cy * newScale;
    applyTransform();
  }, [applyTransform, clampScale]);

  useLayoutEffect(() => {
    if (!centerInViewport) return;
    const outer = outerRef.current;
    if (!outer) return;

    fitContentToViewport();

    const scheduleFit = () => {
      requestAnimationFrame(() => {
        fitContentToViewport();
      });
    };

    const ro = new ResizeObserver(scheduleFit);
    ro.observe(outer);
    return () => ro.disconnect();
  }, [centerInViewport, fitContentToViewport]);

  useEffect(() => {
    if (!wheelZoomEnabled) return;
    const outer = outerRef.current;
    if (!outer) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = outer.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;
      const state = stateRef.current;
      const oldScale = state.scale;
      const newScale = clampScale(
        oldScale + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP),
      );
      state.translateX =
        cursorX - (cursorX - state.translateX) * (newScale / oldScale);
      state.translateY =
        cursorY - (cursorY - state.translateY) * (newScale / oldScale);
      state.scale = newScale;
      applyTransform();
    };
    outer.addEventListener("wheel", handleWheel, { passive: false });
    return () => outer.removeEventListener("wheel", handleWheel);
  }, [applyTransform, clampScale, wheelZoomEnabled]);

  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      const outer = outerRef.current;
      if (!outer) return;

      if (!panEnabled && !pinchZoomEnabled) {
        outer.style.cursor = "default";
        return;
      }

      activePointersRef.current.set(e.pointerId, {
        cx: e.clientX,
        cy: e.clientY,
      });
      e.currentTarget.setPointerCapture(e.pointerId);

      if (activePointersRef.current.size >= 2) {
        draggingRef.current = false;
        if (!pinchZoomEnabled) {
          pinchLastDistRef.current = null;
          outer.style.cursor = panEnabled ? "grab" : "default";
          return;
        }
        const rect = outer.getBoundingClientRect();
        const pinch = pinchMetricsFromMap(activePointersRef.current, rect);
        pinchLastDistRef.current = pinch && pinch.dist >= 8 ? pinch.dist : null;
        outer.style.cursor = panEnabled ? "grab" : "default";
        return;
      }

      const allowSinglePointerPan = panEnabled;
      draggingRef.current = allowSinglePointerPan;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      outer.style.cursor = allowSinglePointerPan ? "grabbing" : "default";
    },
    [panEnabled, pinchZoomEnabled],
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      const outer = outerRef.current;
      if (!outer) return;

      if (activePointersRef.current.has(e.pointerId)) {
        activePointersRef.current.set(e.pointerId, {
          cx: e.clientX,
          cy: e.clientY,
        });
      }

      const rect = outer.getBoundingClientRect();
      if (pinchZoomEnabled && activePointersRef.current.size >= 2) {
        const pinch = pinchMetricsFromMap(activePointersRef.current, rect);
        if (!pinch || pinch.dist < 8) return;
        const lastDist = pinchLastDistRef.current;
        if (lastDist === null || lastDist < 8) {
          pinchLastDistRef.current = pinch.dist;
          return;
        }
        const state = stateRef.current;
        const oldScale = state.scale;
        const factor = pinch.dist / lastDist;
        const newScale = clampScale(oldScale * factor);
        const { midX, midY } = pinch;
        state.translateX =
          midX - (midX - state.translateX) * (newScale / oldScale);
        state.translateY =
          midY - (midY - state.translateY) * (newScale / oldScale);
        state.scale = newScale;
        pinchLastDistRef.current = pinch.dist;
        applyTransform();
        return;
      }

      if (!draggingRef.current) return;
      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      stateRef.current.translateX += dx;
      stateRef.current.translateY += dy;
      applyTransform();
    },
    [applyTransform, clampScale, pinchZoomEnabled],
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      activePointersRef.current.delete(e.pointerId);
      if (activePointersRef.current.size < 2) pinchLastDistRef.current = null;

      if (activePointersRef.current.size === 0) {
        draggingRef.current = false;
      }

      const outer = outerRef.current;
      if (outer) outer.style.cursor = panEnabled ? "grab" : "default";
    },
    [panEnabled],
  );

  const zoomIn = useCallback(() => {
    const outer = outerRef.current;
    if (!outer) return;
    recenterContent();
    const state = stateRef.current;
    const rect = outer.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const oldScale = state.scale;
    const newScale = clampScale(oldScale + ZOOM_STEP);
    state.translateX = cx - (cx - state.translateX) * (newScale / oldScale);
    state.translateY = cy - (cy - state.translateY) * (newScale / oldScale);
    state.scale = newScale;
    applyTransform();
  }, [applyTransform, clampScale, recenterContent]);

  const zoomOut = useCallback(() => {
    const outer = outerRef.current;
    if (!outer) return;
    const state = stateRef.current;
    const rect = outer.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const oldScale = state.scale;
    const newScale = clampScale(oldScale - ZOOM_STEP);
    state.translateX = cx - (cx - state.translateX) * (newScale / oldScale);
    state.translateY = cy - (cy - state.translateY) * (newScale / oldScale);
    state.scale = newScale;
    applyTransform();
  }, [applyTransform, clampScale]);

  const reset = useCallback(() => {
    if (centerInViewport) {
      fitContentToViewport();
      return;
    }
    stateRef.current = { scale: 1, translateX: 0, translateY: 0 };
    applyTransform();
  }, [applyTransform, centerInViewport, fitContentToViewport]);

  useEffect(() => {
    actionsRef.current = { zoomIn, zoomOut, reset };
    return () => {
      actionsRef.current = null;
    };
  }, [actionsRef, zoomIn, zoomOut, reset]);

  return (
    <div
      ref={outerRef}
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        // Pan/zoom: avoid selecting SVG <text> while dragging (browser default drag-select).
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        ...(showFrame
          ? {
              borderRadius: "8px",
              border: "1px solid var(--fd-border, #e5e7eb)",
            }
          : {}),
        cursor: panEnabled ? "grab" : "default",
        touchAction: panEnabled || pinchZoomEnabled ? "none" : "auto",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        ref={innerRef}
        className={
          centerInViewport
            ? "box-border flex h-full min-h-0 w-full items-center justify-center"
            : undefined
        }
        style={{ transformOrigin: "0 0" }}
      >
        {children}
      </div>
    </div>
  );
}

function SvgMount({
  svgHtml,
  bindFunctions,
  className,
  useIntrinsicSize = false,
}: {
  readonly svgHtml: string;
  readonly bindFunctions?: (element: Element) => void;
  readonly className?: string;
  readonly useIntrinsicSize?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    bindFunctions?.(node);

    const svg = node.querySelector("svg");
    if (svg instanceof SVGSVGElement) {
      svg.setAttribute("draggable", "false");
    }

    if (!useIntrinsicSize) return;
    if (!(svg instanceof SVGSVGElement)) return;

    const intrinsicSize = getSvgIntrinsicSize(svg);
    if (!intrinsicSize) return;

    // Mermaid commonly injects width="100%" + max-width, which prevents
    // fullscreen auto-fit from using the diagram's actual aspect box.
    svg.style.width = `${intrinsicSize.width}px`;
    svg.style.height = `${intrinsicSize.height}px`;
    svg.style.maxWidth = "none";
    svg.style.maxHeight = "none";
  }, [svgHtml, bindFunctions, useIntrinsicSize]);

  return (
    <div
      ref={ref}
      className={className}
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  );
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  readonly label: string;
  readonly onClick: () => void;
  readonly children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={buttonVariants({ size: "icon-sm", color: "outline" })}
      onClick={onClick}
      aria-label={label}
    >
      {children}
    </button>
  );
}

function DiagramTitle({ title }: { readonly title: string }) {
  const text = title.trim();
  if (!text) return null;
  return (
    <span className="text-fd-foreground wrap-break-word block max-w-full whitespace-normal font-semibold leading-snug tracking-tight sm:text-base md:text-lg">
      {text}
    </span>
  );
}

export function SvgViewer({
  svgHtml,
  title,
  previewDescription,
  bindFunctions,
}: {
  readonly svgHtml: string;
  readonly title?: string;
  readonly previewDescription?: string;
  readonly bindFunctions?: (element: Element) => void;
}) {
  const [fullscreen, setFullscreen] = useState(false);
  const inlineActionsRef = useRef<ZoomActions | null>(null);
  const fsActionsRef = useRef<ZoomActions | null>(null);
  const trimmedTitle = title?.trim();

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  const renderToolbar = (
    actionsRef: RefObject<ZoomActions | null>,
    showFullscreenToggle: boolean,
    showZoomControls = true,
  ) => (
    <div className="flex flex-wrap items-center gap-1" data-diagram-toolbar>
      {previewDescription?.trim() ? (
        <button
          type="button"
          className={buttonVariants({ size: "icon-sm", color: "outline" })}
          title={previewDescription.trim()}
          aria-label={`Figure note: ${previewDescription.trim()}`}
        >
          <Info style={{ width: 14, height: 14 }} aria-hidden />
        </button>
      ) : null}
      {showZoomControls ? (
        <>
          <ToolbarButton
            label="Zoom in"
            onClick={() => actionsRef.current?.zoomIn()}
          >
            <ZoomIn style={{ width: 14, height: 14 }} />
          </ToolbarButton>
          <ToolbarButton
            label="Zoom out"
            onClick={() => actionsRef.current?.zoomOut()}
          >
            <ZoomOut style={{ width: 14, height: 14 }} />
          </ToolbarButton>
          <ToolbarButton
            label="Reset zoom"
            onClick={() => actionsRef.current?.reset()}
          >
            <RotateCcw style={{ width: 14, height: 14 }} />
          </ToolbarButton>
        </>
      ) : null}
      {showFullscreenToggle ? (
        <ToolbarButton label="Full screen" onClick={() => setFullscreen(true)}>
          <Maximize2 style={{ width: 14, height: 14 }} />
        </ToolbarButton>
      ) : null}
    </div>
  );

  const diagram = (
    actionsRef: RefObject<ZoomActions | null>,
    sizeClass: string,
    wheelZoomEnabled: boolean,
    showFrame: boolean,
    centerInViewport = false,
    useIntrinsicSize = false,
    panEnabled = true,
    pinchZoomEnabled = true,
  ) => (
    <ZoomableViewport
      actionsRef={actionsRef}
      wheelZoomEnabled={wheelZoomEnabled}
      showFrame={showFrame}
      centerInViewport={centerInViewport}
      panEnabled={panEnabled}
      pinchZoomEnabled={pinchZoomEnabled}
      className={`bg-fd-background w-full ${sizeClass}`}
    >
      <SvgMount
        svgHtml={svgHtml}
        bindFunctions={bindFunctions}
        useIntrinsicSize={useIntrinsicSize}
        className="flex select-none justify-center p-2 [&_svg]:max-h-none [&_svg]:max-w-none [&_svg_*]:select-none"
      />
    </ZoomableViewport>
  );

  const overlay =
    fullscreen &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        className="bg-fd-background/98 fixed inset-0 z-50 flex h-dvh max-h-dvh flex-col backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-label={title?.trim() || "Diagram"}
      >
        <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
          <div className="border-fd-border bg-fd-background flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border shadow-sm">
            <div className="border-fd-border bg-fd-muted/25 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-2.5 py-2 sm:px-3 sm:py-2.5">
              <div className="min-w-0 flex-1 pr-2">
                {trimmedTitle ? <DiagramTitle title={trimmedTitle} /> : null}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-1">
                {renderToolbar(fsActionsRef, false)}
                <ToolbarButton
                  label="Close"
                  onClick={() => setFullscreen(false)}
                >
                  <X style={{ width: 14, height: 14 }} />
                </ToolbarButton>
              </div>
            </div>
            <div className="relative min-h-0 flex-1">
              {diagram(fsActionsRef, "h-full min-h-0", true, false, true, true)}
            </div>
          </div>
        </div>
      </div>,
      document.body,
    );

  return (
    <figure className="my-0">
      <div className="border-fd-border bg-fd-background overflow-hidden rounded-lg border shadow-sm">
        <div
          className={`border-fd-border bg-fd-muted/25 flex flex-wrap items-center gap-2 border-b px-2.5 py-2 sm:px-3 sm:py-2.5 ${trimmedTitle ? "justify-between" : "justify-end"}`}
        >
          {trimmedTitle ? (
            <div className="min-w-0 flex-1">
              <DiagramTitle title={trimmedTitle} />
            </div>
          ) : null}
          <div className="flex shrink-0 flex-wrap items-center gap-1">
            {renderToolbar(inlineActionsRef, true, false)}
          </div>
        </div>
        {diagram(
          inlineActionsRef,
          "min-h-[12rem]",
          false,
          false,
          false,
          false,
          false,
          false,
        )}
      </div>
      {overlay}
    </figure>
  );
}
