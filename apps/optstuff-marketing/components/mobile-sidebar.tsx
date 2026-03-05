"use client";

import {
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  SignOutButton,
} from "@workspace/auth/client";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { ExternalLink, Github } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getExternalLinkAriaLabel } from "../lib/a11y";

type NavigationItem = {
  readonly href: string;
  readonly label: string;
  readonly external: boolean;
  readonly showExternalIndicator?: boolean;
};

type MobileSidebarProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly navigation: readonly NavigationItem[];
  readonly githubUrl?: string;
};

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      element.getAttribute("aria-hidden") !== "true",
  );
}

export function MobileSidebar({
  isOpen,
  onClose,
  navigation,
  githubUrl,
}: MobileSidebarProps) {
  // Track if items should animate (only when opening, not when closing)
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const previousFocusedElementRef = useRef<HTMLElement | null>(null);
  const previousBodyOverflowRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);

    handleChange();
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, []);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (isOpen) {
      if (previousBodyOverflowRef.current === null) {
        previousBodyOverflowRef.current = document.body.style.overflow;
      }
      document.body.style.overflow = "hidden";
      if (prefersReducedMotion) {
        setShouldAnimate(true);
      } else {
        // Small delay to ensure CSS transition starts properly
        timer = setTimeout(() => setShouldAnimate(true), 50);
      }
    } else {
      if (previousBodyOverflowRef.current !== null) {
        document.body.style.overflow = previousBodyOverflowRef.current;
        previousBodyOverflowRef.current = null;
      }
      setShouldAnimate(false);
    }

    return () => {
      if (timer !== null) {
        clearTimeout(timer);
      }
      if (previousBodyOverflowRef.current !== null) {
        document.body.style.overflow = previousBodyOverflowRef.current;
        previousBodyOverflowRef.current = null;
      }
    };
  }, [isOpen, prefersReducedMotion]);

  useEffect(() => {
    if (!isOpen) return;

    const sidebarElement = sidebarRef.current;
    if (!sidebarElement) return;

    if (document.activeElement instanceof HTMLElement) {
      previousFocusedElementRef.current = document.activeElement;
    }

    const focusableElements = getFocusableElements(sidebarElement);
    focusableElements[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const currentFocusableElements = getFocusableElements(sidebarElement);
      if (!currentFocusableElements.length) {
        event.preventDefault();
        return;
      }

      const firstElement = currentFocusableElements[0];
      const lastElement =
        currentFocusableElements[currentFocusableElements.length - 1];
      if (!firstElement || !lastElement) return;
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        if (
          activeElement === firstElement ||
          !sidebarElement.contains(activeElement)
        ) {
          event.preventDefault();
          lastElement.focus();
        }
        return;
      }

      if (
        activeElement === lastElement ||
        !sidebarElement.contains(activeElement)
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previousFocusedElementRef.current?.focus();
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Overlay backdrop */}
      <div
        className={cn(
          "bg-background/80 fixed inset-0 z-40 backdrop-blur-sm",
          prefersReducedMotion
            ? "transition-none"
            : "transition-opacity duration-300",
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside
        ref={sidebarRef}
        className={cn(
          "bg-background/95 z-45 fixed right-0 top-0 h-full w-[85vw] max-w-[320px] overscroll-contain backdrop-blur-xl",
          prefersReducedMotion
            ? "transition-none"
            : "transition-transform duration-300 ease-out",
          "border-border/50 border-l shadow-2xl",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
        id="mobile-navigation-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div className="flex h-full flex-col pt-20">
          {/* Navigation links */}
          <nav
            className="flex flex-col px-6"
            aria-label="Mobile navigation links"
          >
            {navigation.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                {...(item.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                aria-label={getExternalLinkAriaLabel(item.label, item.external)}
                className={cn(
                  "border-border/30 text-foreground hover:text-accent focus-visible:ring-ring focus-visible:ring-offset-background group flex items-center justify-between rounded-sm border-b py-4 text-lg font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                  prefersReducedMotion ? "transition-none" : "transition-all",
                  "transform",
                  shouldAnimate
                    ? "translate-x-0 opacity-100"
                    : "translate-x-4 opacity-0",
                )}
                style={{
                  transitionDelay:
                    shouldAnimate && !prefersReducedMotion
                      ? `${index * 60}ms`
                      : "0ms",
                  transitionDuration: prefersReducedMotion ? "0ms" : "300ms",
                  transitionProperty: prefersReducedMotion
                    ? "none"
                    : "transform, opacity, color",
                }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span>{item.label}</span>
                  {(item.showExternalIndicator ?? item.external) ? (
                    <ExternalLink
                      className="h-4 w-4 opacity-80"
                      aria-hidden="true"
                    />
                  ) : null}
                </span>
                <span
                  className="text-muted-foreground transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  →
                </span>
              </Link>
            ))}
          </nav>

          {/* Bottom section: GitHub + Auth */}
          <div
            className={cn(
              "border-border/30 mt-auto border-t p-6",
              prefersReducedMotion
                ? "transition-none"
                : "transition-all duration-300",
              shouldAnimate
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0",
            )}
            style={{
              transitionDelay: shouldAnimate
                ? prefersReducedMotion
                  ? "0ms"
                  : `${navigation.length * 60 + 50}ms`
                : "0ms",
            }}
          >
            {/* GitHub link */}
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring focus-visible:ring-offset-background mb-4 flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                aria-label="View on GitHub (opens in new tab)"
              >
                <Github className="h-5 w-5" aria-hidden="true" />
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
      <div className="border-border bg-muted/50 flex h-11 items-center justify-center rounded-lg border">
        <div className="bg-muted-foreground/20 h-3 w-16 animate-pulse rounded" />
      </div>
    </div>
  );
}
