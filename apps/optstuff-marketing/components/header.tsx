"use client";

import { MobileSidebar } from "@/components/mobile-sidebar";
import {
  calculateBackgroundOpacity,
  calculateBorderOpacity,
  useScrollPercent,
} from "@/hooks/use-scroll-percent";
import {
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  SignOutButton,
} from "@workspace/auth/client";
import { useIsMobile } from "@workspace/hooks/use-mobile";
import { Button } from "@workspace/ui/components/button";
import { Logo } from "@workspace/ui/components/logo";
import { ThemeToggleButton } from "@workspace/ui/components/theme-toggle-button";
import { cn } from "@workspace/ui/lib/utils";
import { Github, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type NavigationItem = {
  readonly href: string;
  readonly label: string;
};

const NAVIGATION: readonly NavigationItem[] = [
  { href: "#demo", label: "Demo" },
  { href: "/blog", label: "Blog" },
  { href: process.env.NEXT_PUBLIC_DOCS_URL ?? "#", label: "Docs" },
] as const;

const HEADER_CONFIG = {
  scroll: { threshold: 100, divisor: 2 },
  style: {
    backgroundColorOpacity: 0.95,
    borderColorMaxOpacity: 0.15,
    borderColorDivisor: 5,
  },
  logo: { size: 32 },
  github: "https://github.com/EricTsai83/optstuff",
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
          <nav className="hidden items-center gap-6 md:flex">
            {NAVIGATION.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground hover:text-foreground dark:text-foreground after:bg-foreground relative text-sm font-medium transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:transition-all after:duration-300 hover:after:w-full"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right: Actions & Mobile menu toggle */}
          <div className="flex flex-row-reverse items-center gap-2 justify-self-end md:gap-3">
            {/* Mobile menu toggle */}
            {isMobile && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-foreground hover:bg-muted relative flex h-9 w-9 items-center justify-center rounded-md transition-colors"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMobileMenuOpen}
              >
                <Menu
                  className={cn(
                    "absolute h-5 w-5 transition-all duration-300",
                    isMobileMenuOpen
                      ? "scale-0 rotate-90 opacity-0"
                      : "scale-100 rotate-0 opacity-100",
                  )}
                />
                <X
                  className={cn(
                    "absolute h-5 w-5 transition-all duration-300",
                    isMobileMenuOpen
                      ? "scale-100 rotate-0 opacity-100"
                      : "scale-0 -rotate-90 opacity-0",
                  )}
                />
              </button>
            )}

            <ThemeToggleButton />

            {/* GitHub link - Desktop only */}
            <a
              href={HEADER_CONFIG.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground dark:text-foreground hover:bg-muted hidden h-9 w-9 items-center justify-center rounded-md transition-colors md:flex"
              aria-label="GitHub repository"
            >
              <Github className="h-5 w-5" />
            </a>

            {/* Desktop auth/CTA buttons */}
            <div className="hidden items-center gap-2 md:flex">
              <ClerkLoading>
                <GetStartedButtonSkeleton />
              </ClerkLoading>
              <ClerkLoaded>
                <SignedOut>
                  <Button asChild size="sm" className="cursor-pointer">
                    <a href="/sign-in">Get Started</a>
                  </Button>
                </SignedOut>
                <SignedIn>
                  <SignOutButton>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="cursor-pointer"
                    >
                      Sign out
                    </Button>
                  </SignOutButton>
                  <Button asChild size="sm" className="cursor-pointer">
                    <a href="/dashboard">Dashboard</a>
                  </Button>
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
          navigation={NAVIGATION}
          githubUrl={HEADER_CONFIG.github}
        />
      )}
    </>
  );
}

function GetStartedButtonSkeleton() {
  return (
    <div className="bg-primary/80 flex h-8 w-24 items-center justify-center rounded-md">
      <div className="bg-primary-foreground/30 h-3 w-16 animate-pulse rounded-sm" />
    </div>
  );
}
