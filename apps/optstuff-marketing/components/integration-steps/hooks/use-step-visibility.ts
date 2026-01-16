"use client";

import { useIntersectionVisibility } from "@/hooks/use-intersection-visibility";

/**
 * Hook to track step element visibility
 * This is a convenience wrapper around useIntersectionVisibility
 */
export function useStepVisibility(stepCount: number) {
  const { visibleItems, itemRefs, setItemRef } =
    useIntersectionVisibility<HTMLDivElement>(stepCount, {
      threshold: 0.2,
      once: true,
    });

  return {
    visibleSteps: visibleItems,
    stepRefs: itemRefs,
    setStepRef: setItemRef,
  };
}
