import { Logo } from "@workspace/ui/components/logo";
import { ExternalLink, Github, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { getExternalLinkAriaLabel } from "../lib/a11y";

type FooterProductItem = {
  href: string;
  label: string;
  external: boolean;
  showExternalIndicator?: boolean;
};

type FooterSocialItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  external: boolean;
};

type FooterNavigation = {
  product: FooterProductItem[];
  social: FooterSocialItem[];
};

const FOOTER_NAVIGATION: FooterNavigation = {
  product: [
    {
      href: process.env.NEXT_PUBLIC_DOCS_URL ?? "#",
      label: "Docs",
      external: true,
    },
    {
      href: "https://optstuff-nextjs.vercel.app",
      label: "Live Demo",
      external: true,
      showExternalIndicator: true,
    },
  ],
  social: [
    {
      href: "https://github.com/EricTsai83/optstuff",
      label: "GitHub",
      icon: Github,
      external: true,
    },
  ],
};

export function Footer() {
  return (
    <footer className="border-border animate-fade-in border-t py-10 sm:py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center gap-8 sm:gap-6">
          {/* Logo */}
          <Link
            href="/"
            className="focus-visible:ring-ring focus-visible:ring-offset-background group flex items-center gap-2.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            aria-label="OptStuff Home"
          >
            <Logo size={28} />
          </Link>

          {/* Navigation */}
          <nav
            className="text-muted-foreground dark:text-foreground flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm sm:gap-x-8"
            aria-label="Footer navigation"
          >
            {FOOTER_NAVIGATION.product.map((item) => {
              const shouldShowExternalIndicator =
                item.showExternalIndicator ?? item.external;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className="hover:text-foreground after:bg-foreground focus-visible:ring-ring focus-visible:ring-offset-background relative rounded-sm transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:transition-all after:duration-300 hover:after:w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  {...(item.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  aria-label={getExternalLinkAriaLabel(
                    item.label,
                    item.external,
                  )}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span>{item.label}</span>
                    {shouldShowExternalIndicator ? (
                      <ExternalLink
                        className="h-3.5 w-3.5 opacity-80"
                        aria-hidden="true"
                      />
                    ) : null}
                  </span>
                </a>
              );
            })}
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
                  className="text-muted-foreground hover:text-foreground dark:text-foreground hover:bg-muted focus-visible:ring-ring focus-visible:ring-offset-background flex h-9 w-9 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  aria-label={getExternalLinkAriaLabel(
                    item.label,
                    item.external,
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
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
