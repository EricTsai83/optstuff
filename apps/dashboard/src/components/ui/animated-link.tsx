import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type AnimatedLinkProps = {
  readonly href: string;
  readonly children: ReactNode;
  /** Whether to show the external link icon on hover */
  readonly showExternalIcon?: boolean;
  /** Whether to open the link in a new tab */
  readonly external?: boolean;
  readonly className?: string;
} & Omit<ComponentProps<typeof Link>, "href" | "children" | "className">;

/**
 * A link component with animated underline on hover.
 * Optionally displays an expanding external link icon.
 */
export function AnimatedLink({
  href,
  children,
  showExternalIcon = false,
  external = false,
  className,
  ...props
}: AnimatedLinkProps) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={cn(
        "group/animated-link inline-flex items-center font-semibold",
        className,
      )}
      {...props}
    >
      {/* Text with animated underline */}
      <span className="relative">
        {children}
        <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-current transition-[width] duration-300 ease-out group-hover/animated-link:w-full" />
      </span>

      {/* Expanding external icon */}
      {showExternalIcon && (
        <span className="ml-0 inline-flex w-0 overflow-hidden transition-[width,margin,opacity] duration-300 ease-out group-hover/animated-link:ml-1 group-hover/animated-link:w-3.5">
          <svg
            className="size-3.5 shrink-0"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      )}
    </Link>
  );
}
