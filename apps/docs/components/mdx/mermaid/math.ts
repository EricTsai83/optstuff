import type { Point } from "./types";

export function roundZoom(v: number) {
  return Number(v.toFixed(2));
}

export function dist(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function mid(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
