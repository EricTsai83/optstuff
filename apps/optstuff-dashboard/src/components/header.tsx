"use client";

import { AnimatedLogo } from "@/components/animated-logo";
import { DOCS_LINKS } from "@/lib/constants";
import { TeamSwitcher } from "@/modules/team";
import { ClerkLoaded, ClerkLoading, UserButton } from "@workspace/auth/client";
import { UserButtonSkeleton } from "@workspace/auth/components/user-button-skeleton";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Bell, BookOpen, Menu, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";

type HeaderProps = {
  readonly teamSlug?: string;
};

export function Header({ teamSlug }: HeaderProps) {
  return (
    <header className="border-border bg-background flex h-16 items-center justify-between border-b px-4">
      {/* Desktop: Logo and Team Selector */}
      <div className="hidden items-center gap-2 md:flex">
        <AnimatedLogo />
        <div className="ml-15 flex items-center gap-2">
          <span className="text-muted-foreground text-lg">/</span>
          <TeamSwitcher currentTeamSlug={teamSlug} />
        </div>
      </div>

      {/* Mobile: Team Selector only */}
      <div className="flex items-center md:hidden">
        <TeamSwitcher currentTeamSlug={teamSlug} />
      </div>

      {/* Desktop Actions */}
      <div className="hidden items-center gap-2 md:flex">
        <SearchInput />
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground transition-colors duration-200"
        >
          Feedback
        </Button>
        <IconButton icon={Bell} hasNotification />
        <IconButton icon={BookOpen} href={DOCS_LINKS.home} />
        <UserAvatar />
      </div>

      {/* Mobile Actions */}
      <div className="flex items-center gap-1 md:hidden">
        <IconButton icon={Search} size="mobile" />
        <IconButton icon={Bell} size="mobile" hasNotification />
        <IconButton icon={Menu} size="mobile" />
      </div>
    </header>
  );
}

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

type IconButtonProps = {
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly href?: string;
  readonly hasNotification?: boolean;
  readonly size?: "default" | "mobile";
};

function IconButton({
  icon: Icon,
  href,
  hasNotification,
  size = "default",
}: IconButtonProps) {
  const isMobile = size === "mobile";
  const buttonSize = isMobile ? "h-9 w-9" : "h-8 w-8";
  const iconSize = isMobile ? "h-5 w-5" : "h-4 w-4";
  const dotPosition = isMobile ? "top-1.5 right-1.5" : "top-1 right-1";

  const button = (
    <Button
      variant="ghost"
      size="icon"
      className={`relative ${buttonSize} transition-colors duration-200`}
      asChild={!!href}
    >
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer">
          <Icon className={iconSize} />
        </a>
      ) : (
        <Icon className={iconSize} />
      )}
    </Button>
  );

  if (hasNotification) {
    return (
      <div className="relative">
        {button}
        <span
          className={`absolute ${dotPosition} h-2 w-2 animate-pulse rounded-full bg-blue-500`}
        />
      </div>
    );
  }

  return button;
}

function UserAvatar() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

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
        >
          <UserButton.MenuItems>
            <UserButton.Action
              label={isDark ? "Light Mode" : "Dark Mode"}
              labelIcon={
                isDark ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )
              }
              onClick={() => setTheme(isDark ? "light" : "dark")}
            />
          </UserButton.MenuItems>
        </UserButton>
      </ClerkLoaded>
    </div>
  );
}
