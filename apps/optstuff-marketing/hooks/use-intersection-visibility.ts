"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseIntersectionVisibilityOptions = {
  /** IntersectionObserver trigger threshold (0-1) */
  readonly threshold?: number;
  /** Whether to trigger only once (stop tracking after entering viewport) */
  readonly once?: boolean;
};

type UseIntersectionVisibilityReturn<T extends HTMLElement> = {
  /** Set of element indices that have entered the viewport */
  readonly visibleItems: ReadonlySet<number>;
  /** Element refs array */
  readonly itemRefs: React.MutableRefObject<(T | null)[]>;
  /** Callback function to set individual element ref */
  readonly setItemRef: (index: number) => (el: T | null) => void;
};

const DEFAULT_THRESHOLD = 0.2;

/**
 * Generic hook to track whether multiple elements have entered the viewport
 *
 * @param itemCount - Number of elements to track
 * @param options - Configuration options
 * @returns Visibility state and ref setter function
 *
 * @example
 * ```tsx
 * const { visibleItems, setItemRef } = useIntersectionVisibility(items.length);
 *
 * return items.map((item, index) => (
 *   <div
 *     key={item.id}
 *     ref={setItemRef(index)}
 *     className={visibleItems.has(index) ? 'visible' : 'hidden'}
 *   >
 *     {item.content}
 *   </div>
 * ));
 * ```
 */
export function useIntersectionVisibility<
  T extends HTMLElement = HTMLDivElement,
>(itemCount: number, options: UseIntersectionVisibilityOptions = {}) {
  const { threshold = DEFAULT_THRESHOLD, once = true } = options;

  const [visibleItems, setVisibleItems] = useState<ReadonlySet<number>>(
    () => new Set(),
  );
  const itemRefs = useRef<(T | null)[]>([]);

  const setItemRef = useCallback(
    (index: number) => (el: T | null) => {
      itemRefs.current[index] = el;
    },
    [],
  );

  useEffect(() => {
    const currentRefs = itemRefs.current;
    const observers: IntersectionObserver[] = [];

    currentRefs.forEach((ref, index) => {
      if (!ref) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            setVisibleItems((prev) => new Set([...prev, index]));
            if (once) {
              observer.disconnect();
            }
          } else if (!once) {
            setVisibleItems((prev) => {
              const next = new Set(prev);
              next.delete(index);
              return next;
            });
          }
        },
        { threshold },
      );

      observer.observe(ref);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [itemCount, threshold, once]);

  return { visibleItems, itemRefs, setItemRef };
}
