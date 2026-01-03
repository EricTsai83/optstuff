"use client";

import { Search, Bell, ChevronDown, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AnimatedLogo } from "@/components/dashboard/animated-logo";

const TEAM_NAME = "Personal Team";
const TEAM_BADGE = "Hobby";
const TEAM_COLOR = "bg-orange-500";
const PROJECTS = ["erictsai83's projects", "Other projects"] as const;

const USER_AVATAR_SRC = "/diverse-user-avatars.png";
const USER_AVATAR_FALLBACK = "ET";

/**
 * Header component
 * Uses CSS media queries instead of useIsMobile hook for better performance
 */
export function Header() {
  return (
    <header className="border-border bg-background flex h-16 items-center justify-between border-b px-4">
      {/* Desktop: Display Logo and Project Selector */}
      <div className="hidden items-center gap-2 md:flex">
        <AnimatedLogo />
        <div className="ml-15 flex items-center gap-2">
          <span className="text-muted-foreground text-lg">/</span>
          <ProjectSelector />
        </div>
      </div>

      {/* Mobile: Display Project Selector only */}
      <div className="flex items-center md:hidden">
        <ProjectSelector />
      </div>

      <DesktopActions />
      <MobileActions />
    </header>
  );
}

/**
 * Project selector component
 */
function ProjectSelector() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="group flex h-8 items-center gap-2 px-2 transition-colors duration-200"
        >
          <div className={`h-5 w-5 rounded-full ${TEAM_COLOR}`} />
          <span className="font-medium">{TEAM_NAME}</span>
          <Badge
            variant="secondary"
            className="hidden text-xs font-normal md:inline-flex"
          >
            {TEAM_BADGE}
          </Badge>
          <ChevronDown className="text-muted-foreground h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="animate-in fade-in-0 zoom-in-95 duration-200"
      >
        {PROJECTS.map((project) => (
          <DropdownMenuItem key={project}>{project}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
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
    </Button>
  );
}

/**
 * User avatar component
 */
function UserAvatar() {
  return (
    <Avatar className="h-8 w-8 transition-transform duration-200 hover:scale-105">
      <AvatarImage src={USER_AVATAR_SRC} />
      <AvatarFallback>{USER_AVATAR_FALLBACK}</AvatarFallback>
    </Avatar>
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
