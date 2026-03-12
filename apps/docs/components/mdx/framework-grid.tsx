import { ArrowRight, SquareTerminal } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const icons: Record<string, ReactNode> = {
  nextjs: (
    <svg viewBox="0 0 180 180" fill="none" className="size-full">
      <mask
        id="nextjs-mask"
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="180"
        height="180"
        style={{ maskType: "alpha" }}
      >
        <circle cx="90" cy="90" r="90" fill="black" />
      </mask>
      <g mask="url(#nextjs-mask)">
        <circle cx="90" cy="90" r="90" className="fill-fd-foreground" />
        <path
          d="M149.508 157.52L69.142 54H54V125.97H66.1136V69.3836L139.999 164.845C143.333 162.614 146.509 160.165 149.508 157.52Z"
          fill="url(#nextjs-grad-0)"
        />
        <rect
          x="115"
          y="54"
          width="12"
          height="72"
          fill="url(#nextjs-grad-1)"
        />
      </g>
      <defs>
        <linearGradient
          id="nextjs-grad-0"
          x1="109"
          y1="116.5"
          x2="144.5"
          y2="160.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop className="[stop-color:var(--color-fd-background)]" />
          <stop
            offset="1"
            className="[stop-color:var(--color-fd-background)]"
            stopOpacity="0"
          />
        </linearGradient>
        <linearGradient
          id="nextjs-grad-1"
          x1="121"
          y1="54"
          x2="120.799"
          y2="106.875"
          gradientUnits="userSpaceOnUse"
        >
          <stop className="[stop-color:var(--color-fd-background)]" />
          <stop
            offset="1"
            className="[stop-color:var(--color-fd-background)]"
            stopOpacity="0"
          />
        </linearGradient>
      </defs>
    </svg>
  ),
  cli: (
    <SquareTerminal
      className="size-full text-fd-foreground"
      strokeWidth={1.5}
    />
  ),
};

type FrameworkCardProps = {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
  readonly href: string;
};

function FrameworkCard({ icon, title, description, href }: FrameworkCardProps) {
  return (
    <Link href={href} className="group flex gap-4 p-6">
      <div className="size-12 shrink-0">{icons[icon]}</div>
      <div className="flex min-w-0 flex-col">
        <p className="text-[0.95rem] font-semibold leading-snug text-fd-foreground">
          {title}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-fd-muted-foreground">
          {description}
        </p>
        <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-fd-primary transition-colors group-hover:text-fd-primary/80">
          Read more
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

type FrameworkGridProps = {
  readonly children: ReactNode;
};

function FrameworkGrid({ children }: FrameworkGridProps) {
  return (
    <div className="not-prose mt-2 overflow-hidden rounded-xl border border-fd-border">
      <div className="grid grid-cols-1 max-sm:divide-y sm:grid-cols-2 sm:divide-x divide-fd-border">
        {children}
      </div>
    </div>
  );
}

export { FrameworkGrid, FrameworkCard };
