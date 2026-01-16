"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Github } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  SignOutButton,
} from "@workspace/auth/client";
import { cn } from "@workspace/ui/lib/utils";

type NavigationItem = {
  readonly href: string;
  readonly label: string;
};

type MobileSidebarProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly navigation: readonly NavigationItem[];
  readonly githubUrl?: string;
};

export function MobileSidebar({
  isOpen,
  onClose,
  navigation,
  githubUrl,
}: MobileSidebarProps) {
  // Track if items should animate (only when opening, not when closing)
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Small delay to ensure CSS transition starts properly
      const timer = setTimeout(() => setShouldAnimate(true), 50);
      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = "";
      setShouldAnimate(false);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Overlay backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity duration-300",
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed right-0 top-0 z-45 h-full w-[280px] bg-background/95 backdrop-blur-xl transition-transform duration-300 ease-out",
          "border-l border-border/50 shadow-2xl",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
        aria-label="Mobile navigation"
        aria-hidden={!isOpen}
      >
        <div className="flex h-full flex-col pt-20">
          {/* Navigation links */}
          <nav className="flex flex-col px-6">
            {navigation.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group flex items-center justify-between border-b border-border/30 py-4 text-lg font-medium text-foreground transition-all hover:text-accent",
                  "transform",
                  shouldAnimate
                    ? "translate-x-0 opacity-100"
                    : "translate-x-4 opacity-0",
                )}
                style={{
                  transitionDelay: shouldAnimate ? `${index * 60}ms` : "0ms",
                  transitionDuration: "300ms",
                  transitionProperty: "transform, opacity, color",
                }}
              >
                <span>{item.label}</span>
                <span className="text-muted-foreground transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </Link>
            ))}
          </nav>

          {/* Bottom section: GitHub + Auth */}
          <div
            className={cn(
              "mt-auto border-t border-border/30 p-6 transition-all duration-300",
              shouldAnimate
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0",
            )}
            style={{
              transitionDelay: shouldAnimate
                ? `${navigation.length * 60 + 50}ms`
                : "0ms",
            }}
          >
            {/* GitHub link */}
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground hover:bg-muted mb-4 flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
              >
                <Github className="h-5 w-5" />
                <span className="text-sm font-medium">View on GitHub</span>
              </a>
            )}
            <MobileAuthButtons onNavClick={onClose} />
          </div>
        </div>
      </aside>
    </>
  );
}

type MobileAuthButtonsProps = {
  readonly onNavClick: () => void;
};

function MobileAuthButtons({ onNavClick }: MobileAuthButtonsProps) {
  return (
    <>
      <ClerkLoading>
        <MobileAuthSkeleton />
      </ClerkLoading>
      <ClerkLoaded>
        <SignedOut>
          <div className="flex flex-col gap-3">
            <Button
              asChild
              className="h-11 w-full cursor-pointer rounded-lg"
              onClick={onNavClick}
            >
              <a href="/sign-up">Get Started</a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 w-full cursor-pointer rounded-lg"
              onClick={onNavClick}
            >
              <a href="/sign-in">Sign in</a>
            </Button>
          </div>
        </SignedOut>
        <SignedIn>
          <div className="flex flex-col gap-3">
            <Button
              asChild
              className="h-11 w-full cursor-pointer rounded-lg"
              onClick={onNavClick}
            >
              <a href="/dashboard">Dashboard</a>
            </Button>
            <SignOutButton>
              <Button
                variant="outline"
                className="h-11 w-full cursor-pointer rounded-lg"
              >
                Sign out
              </Button>
            </SignOutButton>
          </div>
        </SignedIn>
      </ClerkLoaded>
    </>
  );
}

function MobileAuthSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-11 items-center justify-center rounded-lg border border-border bg-muted/50">
        <div className="h-3 w-16 animate-pulse rounded bg-muted-foreground/20" />
      </div>
    </div>
  );
}
