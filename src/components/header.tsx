"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ModeToggleButton } from "@/components/mode-toggle";

type NavigationItem = {
  readonly href: string;
  readonly label: string;
};

type HeaderConfig = {
  readonly scroll: {
    readonly threshold: number;
    readonly divisor: number;
  };
  readonly style: {
    readonly backgroundColorOpacity: number;
    readonly borderColorMaxOpacity: number;
    readonly borderColorDivisor: number;
  };
  readonly logo: {
    readonly size: number;
  };
  readonly navigation: readonly NavigationItem[];
};

const HEADER_CONFIG: HeaderConfig = {
  scroll: {
    threshold: 100,
    divisor: 2,
  },
  style: {
    backgroundColorOpacity: 0.95,
    borderColorMaxOpacity: 0.15,
    borderColorDivisor: 5,
  },
  logo: {
    size: 32,
  },
  navigation: [
    { href: "#demo", label: "Demo" },
    { href: "#features", label: "Features" },
    { href: "#docs", label: "Docs" },
    { href: "#pricing", label: "Pricing" },
  ],
} as const;

/**
 * Calculates scroll percentage
 * @param scrollY Current scroll position
 * @param threshold Scroll threshold
 * @param divisor Scroll divisor
 * @returns Scroll percentage (0-1)
 */
const calculateScrollPercent = (
  scrollY: number,
  threshold: number,
  divisor: number,
): number => {
  return Math.min(scrollY / divisor / threshold, 1);
};

/**
 * Calculates background color opacity
 * @param scrollPercent Scroll percentage
 * @param maxOpacity Maximum opacity
 * @returns Background color opacity value
 */
const calculateBackgroundOpacity = (
  scrollPercent: number,
  maxOpacity: number,
): number => {
  return scrollPercent * maxOpacity;
};

/**
 * Calculates border color opacity
 * @param scrollPercent Scroll percentage
 * @param divisor Divisor
 * @param maxOpacity Maximum opacity
 * @returns Border color opacity value
 */
const calculateBorderOpacity = (
  scrollPercent: number,
  divisor: number,
  maxOpacity: number,
): number => {
  return Math.min(scrollPercent / divisor, maxOpacity);
};

/**
 * Custom hook to track page scroll percentage
 * @param threshold Scroll threshold
 * @param divisor Scroll divisor
 * @returns Scroll percentage (0-1)
 */
const useScrollPercent = (threshold: number, divisor: number): number => {
  const [scrollPercent, setScrollPercent] = useState(0);

  useEffect(() => {
    const handleScroll = (): void => {
      const percent = calculateScrollPercent(
        window.scrollY,
        threshold,
        divisor,
      );
      setScrollPercent(percent);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [threshold, divisor]);

  return scrollPercent;
};

export function Header() {
  const scrollPercent = useScrollPercent(
    HEADER_CONFIG.scroll.threshold,
    HEADER_CONFIG.scroll.divisor,
  );

  const backgroundOpacity = calculateBackgroundOpacity(
    scrollPercent,
    HEADER_CONFIG.style.backgroundColorOpacity,
  );

  const borderOpacity = calculateBorderOpacity(
    scrollPercent,
    HEADER_CONFIG.style.borderColorDivisor,
    HEADER_CONFIG.style.borderColorMaxOpacity,
  );

  return (
    <header
      style={{
        backgroundColor: `color-mix(in srgb, var(--background) ${backgroundOpacity * 100}%, transparent)`,
        borderColor: `color-mix(in srgb, white ${borderOpacity * 100}%, transparent)`,
      }}
      className="animate-fade-in-down fixed top-0 z-100 w-full py-1"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <Logo size={HEADER_CONFIG.logo.size} />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {HEADER_CONFIG.navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground dark:text-accent-foreground hover:text-foreground after:bg-foreground relative text-sm transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:transition-all after:duration-300 hover:after:w-full"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ModeToggleButton />
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground dark:text-accent-foreground hidden transition-transform hover:scale-105 md:inline-flex"
          >
            Log in
          </Button>
          <Button
            size="sm"
            className="bg-accent text-accent-foreground hover:bg-accent/90 hover:shadow-accent/25 rounded-full px-4 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
}
