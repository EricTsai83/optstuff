"use client";

import { Search, Bell, Menu } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  ClerkLoaded,
  ClerkLoading,
  UserButton,
} from "@workspace/auth/client";
import { UserButtonSkeleton } from "@workspace/auth/components/user-button-skeleton";
import { AnimatedLogo } from "@/components/animated-logo";
import { TeamSwitcher } from "@/components/team-switcher";

type HeaderProps = {
  readonly teamSlug?: string;
};

/**
 * Header component
 * Uses CSS media queries instead of useIsMobile hook for better performance
 */
export function Header({ teamSlug }: HeaderProps) {
  return (
    <header className="border-border bg-background flex h-16 items-center justify-between border-b px-4">
      {/* Desktop: Display Logo and Team Selector */}
      <div className="hidden items-center gap-2 md:flex">
        <AnimatedLogo />
        <div className="ml-4 flex items-center gap-2">
          <span className="text-muted-foreground text-lg">/</span>
          <TeamSwitcher currentTeamSlug={teamSlug} />
        </div>
      </div>

      {/* Mobile: Display Team Selector only */}
      <div className="flex items-center md:hidden">
        <TeamSwitcher currentTeamSlug={teamSlug} />
      </div>

      <DesktopActions />
      <MobileActions />
    </header>
  );
}

/**
 * Search input component
 */
function SearchInput() {
  return (
    <div className="relative">
      <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <Input
        placeholder="Find..."
        className="bg-secondary h-8 w-48 border-0 pr-8 pl-9 transition-all duration-200 focus:w-64"
      />
      <kbd className="text-muted-foreground bg-background absolute top-1/2 right-2 -translate-y-1/2 rounded border px-1.5 py-0.5 text-xs">
        F
      </kbd>
    </div>
  );
}

/**
 * Notification button component
 */
function NotificationButton({
  isMobile = false,
}: {
  readonly isMobile?: boolean;
}) {
  const size = isMobile ? "h-9 w-9" : "h-8 w-8";
  const iconSize = isMobile ? "h-5 w-5" : "h-4 w-4";
  const dotPosition = isMobile ? "top-1.5 right-1.5" : "top-1 right-1";

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`relative ${size} transition-colors duration-200`}
    >
      <Bell className={iconSize} />
      <span
        className={`absolute ${dotPosition} h-2 w-2 animate-pulse rounded-full bg-blue-500`}
      />
    </Button>
  );
}

/**
 * Docs button component
 */
function DocsButton({ isMobile = false }: { readonly isMobile?: boolean }) {
  const size = isMobile ? "h-9 w-9" : "h-8 w-8";
  const iconSize = isMobile ? "h-5 w-5" : "h-4 w-4";

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`${size} transition-colors duration-200`}
      asChild
    >
      <a
        href="https://docs.optstuff.dev"
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg
          className={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
      </a>
    </Button>
  );
}

/**
 * User avatar component using Clerk
 */
function UserAvatar() {
  return (
    <div className="flex h-8 w-8 items-center justify-center">
      <ClerkLoading>
        <UserButtonSkeleton />
      </ClerkLoading>
      <ClerkLoaded>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
              userButtonPopoverCard: "shadow-lg",
            },
          }}
        />
      </ClerkLoaded>
    </div>
  );
}

/**
 * Desktop actions component
 */
function DesktopActions() {
  return (
    <div className="hidden items-center gap-2 md:flex">
      <SearchInput />
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground transition-colors duration-200"
      >
        Feedback
      </Button>
      <NotificationButton />
      <DocsButton />
      <UserAvatar />
    </div>
  );
}

/**
 * Mobile actions component
 */
function MobileActions() {
  return (
    <div className="flex items-center gap-1 md:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 transition-colors duration-200"
      >
        <Search className="h-5 w-5" />
      </Button>
      <NotificationButton isMobile />
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 transition-colors duration-200"
      >
        <Menu className="h-5 w-5" />
      </Button>
    </div>
  );
}
