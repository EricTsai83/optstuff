import Link from "next/link";
import { Logo } from "@workspace/ui/components/logo";
import { Github } from "lucide-react";

const FOOTER_NAVIGATION = {
  product: [
    { href: "#demo", label: "Demo" },
    { href: "/blog", label: "Blog" },
    { href: "/docs", label: "Docs" },
  ],
  social: [
    {
      href: "https://github.com/EricTsai83/optstuff",
      label: "GitHub",
      icon: Github,
      external: true,
    },
  ],
} as const;

export function Footer() {
  return (
    <footer className="border-border animate-fade-in border-t py-10 sm:py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center gap-8 sm:gap-6">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2.5">
            <Logo size={28} />
          </Link>

          {/* Navigation */}
          <nav className="text-muted-foreground dark:text-foreground flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm sm:gap-x-8">
            {FOOTER_NAVIGATION.product.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-foreground after:bg-foreground relative transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:transition-all after:duration-300 hover:after:w-full"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Social links */}
          <div className="flex items-center gap-4">
            {FOOTER_NAVIGATION.social.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground dark:text-foreground flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-muted"
                  aria-label={item.label}
                >
                  <Icon className="h-5 w-5" />
                </a>
              );
            })}
          </div>

          {/* Copyright */}
          <p className="text-muted-foreground dark:text-foreground/70 text-center text-xs sm:text-sm">
            © {new Date().getFullYear()} OptStuff. Open source under MIT.
          </p>
        </div>
      </div>
    </footer>
  );
}
