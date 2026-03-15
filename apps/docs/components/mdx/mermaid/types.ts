export type Point = { x: number; y: number };
export type Size = { width: number; height: number };

export type PanGesture = {
  type: "pan";
  startPoint: Point;
  startPan: Point;
};

export type PinchGesture = {
  type: "pinch";
  startDistance: number;
  startMidpoint: Point;
  startZoom: number;
  contentPoint: Point;
};

export type GestureState = PanGesture | PinchGesture | null;

export type MouseDragState = {
  startPoint: Point;
  startPan: Point;
} | null;

export type ScrollDragState = {
  startPoint: Point;
  startScrollLeft: number;
  startScrollTop: number;
} | null;
