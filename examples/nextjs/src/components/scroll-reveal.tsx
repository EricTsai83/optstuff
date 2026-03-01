"use client";

import { createElement, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, CSSProperties, RefObject } from "react";

const DEFAULT_THRESHOLD = 0.08;
const DEFAULT_ROOT_MARGIN = "0px 0px -60px 0px";
const REVEAL_EASING = "cubic-bezier(0.16, 1, 0.3, 1)";

export type ScrollRevealDirection = "up" | "down" | "left" | "right" | "none";

export type ScrollRevealOptions = {
  readonly delay?: number;
  readonly direction?: ScrollRevealDirection;
  readonly distance?: number;
  readonly duration?: number;
  readonly once?: boolean;
  readonly threshold?: number | number[];
  readonly rootMargin?: string;
};

type UseScrollRevealReturn<T extends HTMLElement> = {
  readonly ref: RefObject<T | null>;
  readonly isVisible: boolean;
  readonly style: CSSProperties;
};

function getTranslateValue(direction: ScrollRevealDirection, distance: number) {
  switch (direction) {
    case "up":
      return `translateY(${distance}px)`;
    case "down":
      return `translateY(-${distance}px)`;
    case "left":
      return `translateX(${distance}px)`;
    case "right":
      return `translateX(-${distance}px)`;
    case "none":
      return "none";
  }
}

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>({
  delay = 0,
  direction = "up",
  distance = 32,
  duration = 700,
  once = true,
  threshold = DEFAULT_THRESHOLD,
  rootMargin = DEFAULT_ROOT_MARGIN,
}: ScrollRevealOptions = {}): UseScrollRevealReturn<T> {
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (!("IntersectionObserver" in window)) {
      const frame = requestAnimationFrame(() => {
        setIsVisible(true);
      });
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (once === true) observer.unobserve(entry.target);
          } else if (!once) {
            setIsVisible(false);
          }
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once, rootMargin, threshold]);

  const style = useMemo<CSSProperties>(
    () => ({
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? "none" : getTranslateValue(direction, distance),
      transition: `opacity ${duration}ms ${REVEAL_EASING} ${delay}ms, transform ${duration}ms ${REVEAL_EASING} ${delay}ms`,
      willChange: isVisible ? "auto" : "opacity, transform",
    }),
    [delay, direction, distance, duration, isVisible],
  );

  return { ref, isVisible, style };
}

type ScrollRevealTag = keyof HTMLElementTagNameMap;

export type ScrollRevealProps<TTag extends ScrollRevealTag = "div"> = ScrollRevealOptions &
  Omit<ComponentPropsWithoutRef<TTag>, keyof ScrollRevealOptions | "as" | "style"> & {
    readonly as?: TTag;
  readonly style?: CSSProperties;
};

export function ScrollReveal<TTag extends ScrollRevealTag = "div">({
  as,
  delay,
  direction,
  distance,
  duration,
  once,
  threshold,
  rootMargin,
  style,
  ...restProps
}: ScrollRevealProps<TTag>) {
  const { ref, style: revealStyle } = useScrollReveal<HTMLElement>({
    delay,
    direction,
    distance,
    duration,
    once,
    threshold,
    rootMargin,
  });
  const Component = (as ?? "div") as ScrollRevealTag;

  return createElement(Component, {
    ...restProps,
    ref,
    style: {
      ...revealStyle,
      ...style,
    },
  });
}
