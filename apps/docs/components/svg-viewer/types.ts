export type Point = { x: number; y: number };
export type Size = { width: number; height: number };

/** Mermaid (or similar) post-render callback that wires up interactive elements. */
export type BindFunctions = (el: Element) => void;

/** Drag-to-scroll snapshot captured at pointer/mouse-down. */
export type ScrollDragState = {
  startPoint: Point;
  startScrollLeft: number;
  startScrollTop: number;
} | null;
