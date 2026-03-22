import { ArrowRight, SquareTerminal } from "lucide-react";
import Link from "next/link";
import { useId, type ReactNode } from "react";

type IconRenderer = () => ReactNode;

const warnedMissingIcons = new Set<string>();

function NextJsIcon() {
  const uniqueId = useId().replace(/:/g, "");
  const maskId = `nextjs-mask-${uniqueId}`;
  const grad0Id = `nextjs-grad-0-${uniqueId}`;
  const grad1Id = `nextjs-grad-1-${uniqueId}`;

  return (
    <svg viewBox="0 0 180 180" fill="none" className="size-full">
      <mask
        id={maskId}
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="180"
        height="180"
        style={{ maskType: "alpha" }}
      >
        <circle cx="90" cy="90" r="90" fill="black" />
      </mask>
      <g mask={`url(#${maskId})`}>
        <circle cx="90" cy="90" r="90" className="fill-fd-foreground" />
        <path
          d="M149.508 157.52L69.142 54H54V125.97H66.1136V69.3836L139.999 164.845C143.333 162.614 146.509 160.165 149.508 157.52Z"
          fill={`url(#${grad0Id})`}
        />
        <rect
          x="115"
          y="54"
          width="12"
          height="72"
          fill={`url(#${grad1Id})`}
        />
      </g>
      <defs>
        <linearGradient
          id={grad0Id}
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
          id={grad1Id}
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
  );
}

function PlaceholderIcon() {
  return (
    <div className="flex size-full items-center justify-center rounded-md border border-dashed border-fd-border text-fd-muted-foreground">
      <span className="text-xs font-semibold">?</span>
    </div>
  );
}

const icons: Record<string, IconRenderer> = {
  nextjs: NextJsIcon,
  cli: () => (
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
  const ResolvedIcon = icons[icon] ?? PlaceholderIcon;

  if (
    process.env.NODE_ENV === "development" &&
    !icons[icon] &&
    !warnedMissingIcons.has(icon)
  ) {
    warnedMissingIcons.add(icon);
    console.warn(
      `[FrameworkCard] Missing icon "${icon}". Falling back to placeholder. Available icons: ${Object.keys(icons).join(", ")}`,
    );
  }

  return (
    <Link href={href} className="group flex gap-4 p-6">
      <div className="size-12 shrink-0">
        <ResolvedIcon />
      </div>
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
      <div className="grid grid-cols-1 max-md:divide-y md:grid-cols-2 md:divide-x divide-fd-border">
        {children}
      </div>
    </div>
  );
}

export { FrameworkGrid, FrameworkCard };
