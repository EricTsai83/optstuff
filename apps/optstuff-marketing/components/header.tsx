"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
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
import { cn } from "@workspace/ui/lib/utils";
import { useIsMobile } from "@workspace/hooks/use-mobile";
import { MobileSidebar } from "@/components/mobile-sidebar";
import {
  useScrollPercent,
  calculateBackgroundOpacity,
  calculateBorderOpacity,
} from "@/hooks/use-scroll-percent";

type NavigationItem = {
  readonly href: string;
  readonly label: string;
};

const HEADER_CONFIG = {
  scroll: { threshold: 100, divisor: 2 },
  style: {
    backgroundColorOpacity: 0.95,
    borderColorMaxOpacity: 0.15,
    borderColorDivisor: 5,
  },
  logo: { size: 32 },
  navigation: [
    { href: "#demo", label: "Demo" },
    { href: "#features", label: "Features" },
    { href: "#docs", label: "Docs" },
  ] as readonly NavigationItem[],
} as const;

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const scrollPercent = useScrollPercent(HEADER_CONFIG.scroll);

  const backgroundOpacity = calculateBackgroundOpacity(
    scrollPercent,
    HEADER_CONFIG.style.backgroundColorOpacity,
  );

  const borderOpacity = calculateBorderOpacity(
    scrollPercent,
    HEADER_CONFIG.style.borderColorDivisor,
    HEADER_CONFIG.style.borderColorMaxOpacity,
  );

  // Close mobile menu when switching to desktop view
  useEffect(() => {
    if (!isMobile && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobile, isMobileMenuOpen]);

  return (
    <>
      <header
        style={{
          backgroundColor: `color-mix(in srgb, var(--background) ${Math.max(backgroundOpacity, isMobileMenuOpen ? 1 : 0) * 100}%, transparent)`,
          borderColor: `color-mix(in srgb, white ${borderOpacity * 100}%, transparent)`,
        }}
        className="animate-fade-in-down fixed top-0 z-50 w-full py-1"
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:grid md:grid-cols-[1fr_auto_1fr] md:px-6">
          {/* Left: Logo */}
          <Link
            href="/"
            className="group flex items-center gap-2.5 justify-self-start"
          >
            <Logo size={HEADER_CONFIG.logo.size} />
          </Link>

          {/* Center: Navigation - Desktop only */}
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

          {/* Right: Auth buttons & Mobile menu toggle */}
          <div className="flex flex-row-reverse items-center gap-3 justify-self-end md:gap-4">
            {/* Mobile menu toggle */}
            {isMobile && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="relative flex h-9 w-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMobileMenuOpen}
              >
                <Menu
                  className={cn(
                    "absolute h-5 w-5 transition-all duration-300",
                    isMobileMenuOpen
                      ? "rotate-90 scale-0 opacity-0"
                      : "rotate-0 scale-100 opacity-100",
                  )}
                />
                <X
                  className={cn(
                    "absolute h-5 w-5 transition-all duration-300",
                    isMobileMenuOpen
                      ? "rotate-0 scale-100 opacity-100"
                      : "-rotate-90 scale-0 opacity-0",
                  )}
                />
              </button>
            )}

            <ThemeToggleButton />

            {/* Desktop auth buttons */}
            <div className="hidden items-center gap-4 md:flex">
              <ClerkLoading>
                <AuthButtonsSkeleton />
                <SignOutButtonSkeleton />
              </ClerkLoading>
              <ClerkLoaded>
                <SignedOut>
                  <Button
                    asChild
                    variant="outline"
                    className="w-25 cursor-pointer"
                  >
                    <a href="/sign-in">Sign in</a>
                  </Button>
                </SignedOut>
                <SignedIn>
                  <Button
                    asChild
                    className="w-25 cursor-pointer bg-accent text-accent-foreground hover:bg-accent/95"
                  >
                    <a href="/dashboard">Dashboard</a>
                  </Button>
                  <SignOutButton>
                    <Button variant="outline" className="w-20 cursor-pointer">
                      Sign out
                    </Button>
                  </SignOutButton>
                </SignedIn>
              </ClerkLoaded>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      {isMobile && (
        <MobileSidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          navigation={HEADER_CONFIG.navigation}
        />
      )}
    </>
  );
}

function AuthButtonsSkeleton() {
  return (
    <div className="flex h-9 w-25 items-center justify-center rounded-md border border-border bg-background">
      <div className="h-3 w-14 animate-pulse rounded-sm bg-muted-foreground/20" />
    </div>
  );
}

function SignOutButtonSkeleton() {
  return (
    <div className="flex h-9 w-20 items-center justify-center rounded-md border border-border bg-background">
      <div className="h-3 w-12 animate-pulse rounded-sm bg-muted-foreground/20" />
    </div>
  );
}
