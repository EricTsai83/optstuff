import Link from "next/link";
import { Logo } from "@/components/logo";

export function Footer() {
  return (
    <footer className="border-border animate-fade-in border-t py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <Link href="/" className="group flex items-center gap-2.5">
            <Logo />
          </Link>

          <nav className="text-muted-foreground flex items-center gap-6 text-sm">
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

          <p className="text-muted-foreground text-sm">Open source under MIT</p>
        </div>
      </div>
    </footer>
  );
}
