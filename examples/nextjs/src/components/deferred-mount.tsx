"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type DeferredMountProps = {
  children: ReactNode;
  placeholder?: ReactNode;
  rootMargin?: string;
  className?: string;
};

export function DeferredMount({
  children,
  placeholder = null,
  rootMargin = "300px 0px",
  className,
}: DeferredMountProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isVisible) return;

    const node = containerRef.current;
    if (!node) return;

    if (!("IntersectionObserver" in window)) {
      const timeoutId = globalThis.setTimeout(() => {
        setIsVisible(true);
      }, 0);
      return () => globalThis.clearTimeout(timeoutId);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isVisible, rootMargin]);

  return (
    <div ref={containerRef} className={className}>
      {isVisible ? children : placeholder}
    </div>
  );
}
