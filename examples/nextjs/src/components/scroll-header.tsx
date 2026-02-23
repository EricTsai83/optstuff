"use client";

import { useEffect, useState } from "react";

export function ScrollHeader({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className="fixed top-0 z-40 w-full border-b"
      style={{
        borderColor: scrolled ? "var(--border)" : "transparent",
        backgroundColor: scrolled ? "color-mix(in srgb, var(--background) 80%, transparent)" : "transparent",
        backdropFilter: scrolled ? "blur(24px)" : "blur(0px)",
        WebkitBackdropFilter: scrolled ? "blur(24px)" : "blur(0px)",
        transition: "background-color 0.5s cubic-bezier(0.4, 0, 0.2, 1), backdrop-filter 0.5s cubic-bezier(0.4, 0, 0.2, 1), -webkit-backdrop-filter 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {children}
    </header>
  );
}
