"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { Logo } from "@workspace/ui/components/logo";
import { ThemeToggleButton } from "@workspace/ui/components/theme-toggle-button";
import {
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  SignOutButton,
} from "@workspace/auth/client";

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
          <ClerkLoading>
            <AuthButtonsSkeleton />
          </ClerkLoading>
          <ClerkLoaded>
            <SignedOut>
              <Button
                asChild
                className="w-18 cursor-pointer bg-accent text-accent-foreground hover:bg-accent/95"
              >
                <a href="/dashboard/sign-in">Sign in</a>
              </Button>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center gap-4">
                <ThemeToggleButton />
                <SignOutButton>
                  <Button variant="outline" className="cursor-pointer w-20 ">
                    Sign out
                  </Button>
                </SignOutButton>

                <Button className="w-25 cursor-pointer bg-accent text-accent-foreground hover:bg-accent/95">
                  <a href="/dashboard">Dashboard</a>
                </Button>
              </div>
            </SignedIn>
          </ClerkLoaded>
        </div>
      </div>
    </header>
  );
}

/**
 * Skeleton for auth buttons while Clerk is loading
 */
function AuthButtonsSkeleton() {
  return (
    <div className="flex items-center gap-4">
      {/* ThemeToggleButton skeleton */}
      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-secondary">
        <div className="h-4 w-4 animate-pulse rounded-full bg-muted-foreground/20" />
      </div>

      {/* Sign out 按鈕 skeleton */}
      <div className="flex h-9 w-20 items-center justify-center rounded-md border border-border bg-background">
        <div className="h-3 w-12 animate-pulse rounded-sm bg-muted-foreground/20" />
      </div>

      {/* Dashboard 按鈕 skeleton */}
      <div className="flex h-9 w-25 items-center justify-center rounded-md bg-accent/20">
        <div className="h-3 w-14 animate-pulse rounded-sm bg-accent/30" />
      </div>
    </div>
  );
}
