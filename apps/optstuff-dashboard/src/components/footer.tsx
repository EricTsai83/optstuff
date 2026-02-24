"use client";

import { env } from "@/env";
import { DOCS_LINKS } from "@/lib/constants";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { LogoIcon } from "@workspace/ui/components/logo";
import { cn } from "@workspace/ui/lib/utils";
import { ChevronDown, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const appDomain = new URL(env.NEXT_PUBLIC_APP_URL).hostname;

const FOOTER_LINKS = [
  { name: "Home", href: "/" },
  { name: "Docs", href: DOCS_LINKS.home, external: true },
  { name: "Legal", href: "#", hasDropdown: true },
];

const THEME_OPTIONS = [
  { id: "system", icon: Monitor, label: "System" },
  { id: "light", icon: Sun, label: "Light" },
  { id: "dark", icon: Moon, label: "Dark" },
] as const;

export function Footer() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

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
              {FOOTER_LINKS.map((link) =>
                link.hasDropdown ? (
                  <LegalDropdown key={link.name} />
                ) : (
                  <FooterLink key={link.name} {...link} />
                ),
              )}
            </nav>
          </div>

          {/* Right: Status and theme */}
          <div className="flex items-center gap-4">
            <a
              href={`https://status.${appDomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent flex items-center gap-2 text-sm transition-all duration-200 hover:underline"
            >
              <span className="bg-accent h-2 w-2 animate-pulse rounded-full" />
              All systems normal.
            </a>

            <ThemeSwitcher
              mounted={mounted}
              theme={theme}
              setTheme={setTheme}
            />
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  name,
  href,
  external,
}: {
  name: string;
  href: string;
  external?: boolean;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-muted-foreground hover:text-foreground h-8 px-2 text-sm transition-colors duration-200"
      asChild
    >
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {name}
      </a>
    </Button>
  );
}

function LegalDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground h-8 px-2 text-sm transition-colors duration-200"
        >
          Legal
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
  );
}

function ThemeSwitcher({
  mounted,
  theme,
  setTheme,
}: {
  mounted: boolean;
  theme?: string;
  setTheme: (theme: string) => void;
}) {
  return (
    <div className="border-border flex items-center gap-0.5 rounded-lg border p-0.5">
      {THEME_OPTIONS.map((option) => (
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
  );
}
