import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ModeToggleButton } from "@/components/mode-toggle";

export function Header() {
  return (
    <header className="bg-background/80 animate-fade-in-down sticky top-0 z-50 w-full backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="#demo"
            className="text-muted-foreground dark:text-accent-foreground hover:text-foreground after:bg-foreground relative text-sm transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:transition-all after:duration-300 hover:after:w-full"
          >
            Demo
          </Link>
          <Link
            href="#features"
            className="text-muted-foreground dark:text-accent-foreground hover:text-foreground after:bg-foreground relative text-sm transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:transition-all after:duration-300 hover:after:w-full"
          >
            Features
          </Link>
          <Link
            href="#docs"
            className="text-muted-foreground dark:text-accent-foreground hover:text-foreground after:bg-foreground relative text-sm transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:transition-all after:duration-300 hover:after:w-full"
          >
            Docs
          </Link>
          <Link
            href="#pricing"
            className="text-muted-foreground dark:text-accent-foreground hover:text-foreground after:bg-foreground relative text-sm transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:transition-all after:duration-300 hover:after:w-full"
          >
            Pricing
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ModeToggleButton />
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground dark:text-accent-foreground hidden transition-transform hover:scale-105 md:inline-flex"
          >
            Log in
          </Button>
          <Button
            size="sm"
            className="bg-accent text-accent-foreground hover:bg-accent/90 hover:shadow-accent/25 rounded-full px-4 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
}
