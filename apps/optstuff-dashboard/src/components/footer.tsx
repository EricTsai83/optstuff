"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { ChevronDown, Monitor, Sun, Moon } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { LogoIcon } from "@workspace/ui/components/logo";
import { cn } from "@workspace/ui/lib/utils";

type FooterLink = {
  name: string;
  href: string;
  external?: boolean;
  hasDropdown?: boolean;
};

const footerLinks: FooterLink[] = [
  { name: "Home", href: "/" },
  { name: "Docs", href: "https://docs.optstuff.dev", external: true },
  { name: "Contact", href: "mailto:support@optstuff.dev" },
  { name: "Legal", href: "#", hasDropdown: true },
];

const themeOptions = [
  { id: "system", icon: Monitor, label: "System" },
  { id: "light", icon: Sun, label: "Light" },
  { id: "dark", icon: Moon, label: "Dark" },
] as const;

export function Footer() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only show theme after mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <footer className="border-border bg-background animate-in fade-in mt-8 border-t py-4 duration-500">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {/* Left: Logo and links */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:justify-start">
            <LogoIcon size={28} />

            <nav className="flex flex-wrap items-center justify-center gap-1">
              {footerLinks.map((link) =>
                link.hasDropdown ? (
                  <DropdownMenu key={link.name}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground h-8 px-2 text-sm transition-colors duration-200"
                      >
                        {link.name}
                        <ChevronDown className="ml-1 h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem asChild>
                        <a href="/privacy">Privacy Policy</a>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href="/terms">Terms of Service</a>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    key={link.name}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground h-8 px-2 text-sm transition-colors duration-200"
                    asChild
                  >
                    <a
                      href={link.href}
                      {...(link.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      {link.name}
                    </a>
                  </Button>
                ),
              )}
            </nav>
          </div>

          {/* Right: Status and controls */}
          <div className="flex items-center gap-4">
            <a
              href="https://status.optstuff.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent flex items-center gap-2 text-sm transition-all duration-200 hover:underline"
            >
              <span className="bg-accent h-2 w-2 animate-pulse rounded-full" />
              All systems normal.
            </a>

            {/* Theme switcher */}
            <div className="border-border flex items-center gap-0.5 rounded-lg border p-0.5">
              {themeOptions.map((option) => (
                <Button
                  key={option.id}
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-7 w-7 transition-colors duration-200",
                    mounted && theme === option.id
                      ? "text-foreground bg-secondary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => setTheme(option.id)}
                  aria-label={option.label}
                >
                  <option.icon className="h-3.5 w-3.5" />
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
