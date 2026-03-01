import { ScrollHeader } from "@/components/scroll-header";
import { NAV_LINKS, RESOURCE_LINKS } from "@/components/home-header-links";

function renderNavLinks(variant: "desktop" | "mobile") {
  return NAV_LINKS.map((link) => (
    <a
      key={link.href}
      href={link.href}
      className={
        variant === "desktop"
          ? "hover:text-foreground hover:bg-card-hover rounded-lg px-3.5 py-2 transition-all"
          : "text-foreground hover:bg-card-hover flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors"
      }
      tabIndex={variant === "mobile" ? 0 : undefined}
    >
      {variant === "mobile" ? (
        <span
          className={`flex size-7 shrink-0 items-center justify-center rounded-md ${link.mobileIconClassName}`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="size-3.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d={link.mobileIconPath}
            />
          </svg>
        </span>
      ) : null}
      {link.label}
    </a>
  ));
}

function renderResourceLinks(variant: "desktop" | "mobile") {
  return RESOURCE_LINKS.map((link) => (
    <a
      key={link.href}
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        variant === "desktop"
          ? "text-muted hover:text-foreground hover:bg-card-hover flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-all"
          : "text-foreground hover:bg-card-hover flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors"
      }
      tabIndex={variant === "mobile" ? 0 : undefined}
    >
      {variant === "mobile" ? (
        <span
          className={`flex size-7 shrink-0 items-center justify-center rounded-md ${link.mobileIconClassName}`}
        >
          <svg viewBox={link.iconViewBox} fill="currentColor" className="size-3.5">
            {link.iconPaths.map((path) => (
              <path key={path} d={path} />
            ))}
          </svg>
        </span>
      ) : (
        <svg viewBox={link.iconViewBox} fill="currentColor" className="size-4">
          {link.iconPaths.map((path) => (
            <path key={path} d={path} />
          ))}
        </svg>
      )}
      {variant === "desktop" ? link.desktopLabel : link.mobileLabel}
    </a>
  ));
}

export function HomeHeader() {
  return (
    <ScrollHeader>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-18 sm:px-6">
        {/* Logo */}
        <a
          href="#"
          className="group flex items-center gap-2.5 transition-opacity hover:opacity-80"
          aria-label="OptStuff home"
          tabIndex={0}
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 transition-colors group-hover:bg-emerald-500/20">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="size-4.5 text-emerald-600 dark:text-emerald-400"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
            </svg>
          </div>
          <span className="text-foreground text-sm font-semibold tracking-tight">
            OptStuff
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="text-muted hidden items-center justify-center gap-1 text-sm md:flex">
          {renderNavLinks("desktop")}
        </nav>

        {/* Desktop right */}
        <div className="hidden items-center justify-end gap-2 md:flex">
          {renderResourceLinks("desktop")}
        </div>

        {/* ─── Mobile menu ─── */}
        <details className="group relative md:hidden">
          <summary
            className="text-muted hover:text-foreground border-border bg-card hover:bg-card-hover flex cursor-pointer list-none items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all [&::-webkit-details-marker]:hidden"
            aria-label="Open navigation menu"
            tabIndex={0}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="size-4"
            >
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
            Menu
          </summary>
          <div className="border-border bg-card absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-[260px] origin-top-right rounded-xl border p-2 shadow-2xl">
            <p className="text-muted mb-1 px-3 pt-2 text-[11px] font-semibold uppercase tracking-wider">
              Navigate
            </p>
            {renderNavLinks("mobile")}

            <div className="border-border my-2 border-t" />

            <p className="text-muted mb-1 px-3 pt-1 text-[11px] font-semibold uppercase tracking-wider">
              Resources
            </p>
            {renderResourceLinks("mobile")}
          </div>
        </details>
      </div>
    </ScrollHeader>
  );
}
