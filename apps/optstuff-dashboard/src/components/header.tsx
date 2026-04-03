"use client";

import { AnimatedLogo } from "@/components/animated-logo";
import { HeaderShell } from "@/components/header-shell";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { DOCS_LINKS } from "@/lib/constants";
import { TeamSwitcher } from "@/modules/team";
import { ClerkLoaded, ClerkLoading, UserButton } from "@workspace/auth/client";
import { UserButtonSkeleton } from "@workspace/auth/components/user-button-skeleton";
import { useIsMobile } from "@workspace/hooks/use-mobile";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { BookOpen, Home, Menu, Moon, Search, Sun, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type HeaderProps = {
  readonly teamSlug?: string;
};

export function Header({ teamSlug }: HeaderProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile]);

  function handleToggleSidebar() {
    setIsSidebarOpen((prev) => !prev);
  }

  return (
    <>
      <HeaderShell
        desktopLeft={
          <>
            <AnimatedLogo />
            <div className="ml-15 flex items-center gap-2">
              <span
                className="text-muted-foreground text-lg"
                aria-hidden="true"
              >
                /
              </span>
              <TeamSwitcher currentTeamSlug={teamSlug} />
            </div>
          </>
        }
        mobileLeft={<TeamSwitcher currentTeamSlug={teamSlug} />}
        desktopRight={
          <>
            <SearchInput />
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground transition-colors duration-200"
              aria-label="Send feedback"
              onClick={() =>
                window.open(
                  "https://github.com/EricTsai83/optstuff/issues/new",
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            >
              Feedback
            </Button>
            <IconButton
              icon={BookOpen}
              href={DOCS_LINKS.home}
              ariaLabel="Documentation"
            />
            <UserAvatar />
          </>
        }
        mobileRight={
          <>
            <IconButton icon={Search} size="mobile" ariaLabel="Search" />
            <IconButton
              icon={isSidebarOpen ? X : Menu}
              size="mobile"
              onClick={handleToggleSidebar}
              ariaLabel={isSidebarOpen ? "Close menu" : "Open menu"}
            />
          </>
        }
      />

      <MobileSidebar open={isSidebarOpen} onOpenChange={setIsSidebarOpen} />
    </>
  );
}

function SearchInput() {
  return (
    <div className="relative">
      <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
      <Input
        placeholder="Find..."
        className="bg-secondary h-8 w-48 border-0 pl-9 pr-8 transition-all duration-200 focus:w-64"
        aria-label="Search"
      />
      <kbd className="text-muted-foreground bg-background absolute right-2 top-1/2 -translate-y-1/2 rounded border px-1.5 py-0.5 text-xs">
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
  readonly onClick?: () => void;
  readonly ariaLabel?: string;
};

function IconButton({
  icon: Icon,
  href,
  hasNotification,
  size = "default",
  onClick,
  ariaLabel,
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
      onClick={onClick}
      aria-label={ariaLabel}
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
          aria-hidden="true"
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
          <UserButton.MenuItems>
            <UserButton.Action
              label="Home Page"
              labelIcon={<Home className="h-4 w-4" />}
              onClick={() => (window.location.href = "/")}
            />
          </UserButton.MenuItems>
        </UserButton>
      </ClerkLoaded>
    </div>
  );
}
