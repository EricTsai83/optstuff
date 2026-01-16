"use client";

import { useEffect } from "react";
import Link from "next/link";
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
};

export function MobileSidebar({
  isOpen,
  onClose,
  navigation,
}: MobileSidebarProps) {
  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
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
                className="group flex items-center justify-between border-b border-border/30 py-4 text-lg font-medium text-foreground transition-colors hover:text-accent"
                style={{
                  animationDelay: isOpen ? `${index * 50}ms` : undefined,
                }}
              >
                {item.label}
                <span className="text-muted-foreground transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </Link>
            ))}
          </nav>

          {/* Auth buttons */}
          <div className="mt-auto border-t border-border/30 p-6">
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
          <Button
            asChild
            className="h-11 w-full cursor-pointer rounded-lg"
            onClick={onNavClick}
          >
            <a href="/sign-in">Sign in</a>
          </Button>
        </SignedOut>
        <SignedIn>
          <div className="flex flex-col gap-3">
            <Button
              asChild
              className="h-11 w-full cursor-pointer rounded-lg bg-accent text-accent-foreground hover:bg-accent/95"
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
