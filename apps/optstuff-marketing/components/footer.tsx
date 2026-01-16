import Link from "next/link";
import { Logo } from "@workspace/ui/components/logo";

export function Footer() {
  return (
    <footer className="border-border animate-fade-in border-t py-8 sm:py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center gap-6 sm:gap-8">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2.5">
            <Logo size={28} />
          </Link>

          {/* Navigation */}
          <nav className="text-muted-foreground flex flex-wrap items-center justify-center gap-4 text-sm sm:gap-6">
            <Link
              href="#"
              className="hover:text-foreground after:bg-foreground relative transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:transition-all after:duration-300 hover:after:w-full"
            >
              Docs
            </Link>
            <Link
              href="#"
              className="hover:text-foreground after:bg-foreground relative transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:transition-all after:duration-300 hover:after:w-full"
            >
              GitHub
            </Link>
            <Link
              href="#"
              className="hover:text-foreground after:bg-foreground relative transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:transition-all after:duration-300 hover:after:w-full"
            >
              Twitter
            </Link>
          </nav>

          {/* Copyright */}
          <p className="text-muted-foreground text-center text-xs sm:text-sm">
            Open source under MIT
          </p>
        </div>
      </div>
    </footer>
  );
}
