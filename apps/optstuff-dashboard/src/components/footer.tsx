"use client";

import { ChevronDown, Monitor, Sun, Settings } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { LogoIcon } from "@workspace/ui/components/logo";

const footerLinks = [
  { name: "Home", href: "#" },
  { name: "Docs", href: "#" },
  { name: "Academy", href: "#" },
  { name: "Contact", href: "#" },
  { name: "Legal", href: "#", hasDropdown: true },
];

export function Footer() {
  return (
    <footer className="border-border bg-background animate-in fade-in mt-8 border-t py-4 duration-500">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {/* Left: Logo and links */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:justify-start">
            {/* Logo */}
            <LogoIcon size={28} />

            {/* Navigation links */}
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
                    <DropdownMenuContent
                      align="start"
                      className="animate-in fade-in-0 zoom-in-95 duration-200"
                    >
                      <DropdownMenuItem>Option 1</DropdownMenuItem>
                      <DropdownMenuItem>Option 2</DropdownMenuItem>
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
                    <a href={link.href}>{link.name}</a>
                  </Button>
                ),
              )}
            </nav>
          </div>

          {/* Right: Status and controls */}
          <div className="flex items-center gap-4">
            {/* Status indicator */}
            <a
              href="#"
              className="text-accent flex items-center gap-2 text-sm transition-all duration-200 hover:underline"
            >
              <span className="bg-accent h-2 w-2 animate-pulse rounded-full" />
              All systems normal.
            </a>

            {/* Utility buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground h-8 w-8 transition-colors duration-200"
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground h-8 w-8 transition-colors duration-200"
              >
                <Sun className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground h-8 w-8 transition-colors duration-200"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
