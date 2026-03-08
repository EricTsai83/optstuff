"use client";

import { DOCS_LINKS } from "@/lib/constants";
import { ClerkLoaded, ClerkLoading, UserButton } from "@workspace/auth/client";
import { UserButtonSkeleton } from "@workspace/auth/components/user-button-skeleton";
import { Button } from "@workspace/ui/components/button";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@workspace/ui/components/drawer";
import { Separator } from "@workspace/ui/components/separator";
import {
  BookOpen,
  FileText,
  HelpCircle,
  Home,
  MessageSquare,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";

type SidebarLink = {
  readonly label: string;
  readonly href: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly external: boolean;
};

const SIDEBAR_LINKS: readonly SidebarLink[] = [
  {
    label: "Home",
    href: "/",
    icon: Home,
    external: false,
  },
  {
    label: "Documentation",
    href: DOCS_LINKS.home,
    icon: BookOpen,
    external: true,
  },
  {
    label: "Changelog",
    href: DOCS_LINKS.changelog,
    icon: FileText,
    external: true,
  },
  {
    label: "FAQ",
    href: DOCS_LINKS.faq,
    icon: HelpCircle,
    external: true,
  },
];

type MobileSidebarProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
};

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="md:hidden">
        <DrawerTitle className="sr-only">Menu</DrawerTitle>

        <nav className="scrollbar-hide flex flex-col gap-1 overflow-y-auto overscroll-contain px-4 pb-2 pt-1">
          <p className="text-muted-foreground mb-1 px-3 text-xs font-medium uppercase tracking-wider">
            Menu
          </p>

          {SIDEBAR_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.href}
                variant="ghost"
                asChild
                className="h-auto justify-start gap-3 px-3 py-2.5 text-foreground [&_svg]:text-muted-foreground [&:hover_svg]:text-accent-foreground"
              >
                <a
                  href={item.href}
                  onClick={() => onOpenChange(false)}
                  {...(item.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  <Icon />
                  <span className="flex-1">{item.label}</span>
                  {item.external && (
                    <span className="text-muted-foreground text-xs">↗</span>
                  )}
                </a>
              </Button>
            );
          })}

          <Separator className="my-2" />

          <p className="text-muted-foreground mb-1 px-3 text-xs font-medium uppercase tracking-wider">
            Preferences
          </p>

          <Button
            variant="ghost"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="h-auto justify-start gap-3 px-3 py-2.5 text-foreground [&_svg]:text-muted-foreground [&:hover_svg]:text-accent-foreground"
          >
            {isDark ? <Sun /> : <Moon />}
            <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
          </Button>

          <Button
            variant="ghost"
            className="h-auto justify-start gap-3 px-3 py-2.5 text-foreground [&_svg]:text-muted-foreground [&:hover_svg]:text-accent-foreground"
          >
            <MessageSquare />
            <span>Feedback</span>
          </Button>
        </nav>

        <div className="border-border border-t px-4 py-3">
          <div className="flex items-center gap-3 px-3">
            <ClerkLoading>
              <UserButtonSkeleton />
              <div className="bg-muted h-3 w-20 animate-pulse rounded" />
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
              <span className="text-muted-foreground text-sm">Account</span>
            </ClerkLoaded>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
