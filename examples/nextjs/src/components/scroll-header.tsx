"use client";

import { useEffect, useState } from "react";

export function ScrollHeader({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let rafId = 0;
    const threshold = 20;

    const updateScrolled = () => {
      const next = window.scrollY > threshold;
      setScrolled((prev) => (prev === next ? prev : next));
    };

    const handleScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        updateScrolled();
      });
    };

    updateScrolled();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return (
    <header
      className="fixed top-0 z-40 w-full border-b"
      style={{
        borderColor: scrolled ? "var(--border)" : "transparent",
        backgroundColor: scrolled
          ? "color-mix(in srgb, var(--background) 80%, transparent)"
          : "transparent",
        backdropFilter: scrolled ? "blur(24px)" : "blur(0px)",
        WebkitBackdropFilter: scrolled ? "blur(24px)" : "blur(0px)",
        transition:
          "background-color 0.5s cubic-bezier(0.4, 0, 0.2, 1), backdrop-filter 0.5s cubic-bezier(0.4, 0, 0.2, 1), -webkit-backdrop-filter 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {children}
    </header>
  );
}
