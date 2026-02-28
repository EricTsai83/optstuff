import { ScrollHeader } from "@/components/scroll-header";

const NEXTJS_DOCS_URL =
  "https://docs-optstuff.vercel.app/getting-started/integration-guide/nextjs";

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
          <a
            href="#demo"
            className="hover:text-foreground hover:bg-card-hover rounded-lg px-3.5 py-2 transition-all"
          >
            Demo
          </a>
          <a
            href="#how-it-works"
            className="hover:text-foreground hover:bg-card-hover rounded-lg px-3.5 py-2 transition-all"
          >
            How it works
          </a>
          <a
            href="#playground"
            className="hover:text-foreground hover:bg-card-hover rounded-lg px-3.5 py-2 transition-all"
          >
            Playground
          </a>
        </nav>

        {/* Desktop right */}
        <div className="hidden items-center justify-end gap-2 md:flex">
          <a
            href={NEXTJS_DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted hover:text-foreground hover:bg-card-hover flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-all"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="size-4">
              <path d="M2.75 1a.75.75 0 0 0-.75.75v11.5c0 .138.112.25.25.25h10.5a.75.75 0 0 0 .75-.75V1.75a.75.75 0 0 0-.75-.75zm-2.25.75C.5.784 1.284 0 2.25 0h10.5c.966 0 1.75.784 1.75 1.75v11.5A1.75 1.75 0 0 1 12.75 15H2.25A1.75 1.75 0 0 1 .5 13.25z" />
              <path d="M4 3.75a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 0 1.5h-5.5A.75.75 0 0 1 4 3.75m0 3a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 0 1.5h-5.5A.75.75 0 0 1 4 6.75m0 3a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 0 1.5h-3.5A.75.75 0 0 1 4 9.75" />
            </svg>
            Docs
          </a>
          <a
            href="https://github.com/EricTsai83/optstuff"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted hover:text-foreground hover:bg-card-hover flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-all"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="size-4">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
            GitHub
          </a>
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
          <div className="border-border bg-card animate-scale-in absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-[260px] origin-top-right rounded-xl border p-2 shadow-2xl">
            <p className="text-muted mb-1 px-3 pt-2 text-[11px] font-semibold uppercase tracking-wider">
              Navigate
            </p>
            <a
              href="#demo"
              className="text-foreground hover:bg-card-hover flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors"
              tabIndex={0}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                </svg>
              </span>
              Demo
            </a>
            <a
              href="#how-it-works"
              className="text-foreground hover:bg-card-hover flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors"
              tabIndex={0}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                </svg>
              </span>
              How it works
            </a>
            <a
              href="#playground"
              className="text-foreground hover:bg-card-hover flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors"
              tabIndex={0}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 17.25V6.75A2.25 2.25 0 0 0 18.75 4.5H5.25A2.25 2.25 0 0 0 3 6.75v10.5A2.25 2.25 0 0 0 5.25 20Z" />
                </svg>
              </span>
              Playground
            </a>

            <div className="border-border my-2 border-t" />

            <p className="text-muted mb-1 px-3 pt-1 text-[11px] font-semibold uppercase tracking-wider">
              Resources
            </p>
            <a
              href={NEXTJS_DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:bg-card-hover flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors"
              tabIndex={0}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                <svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5">
                  <path d="M2.75 1a.75.75 0 0 0-.75.75v11.5c0 .138.112.25.25.25h10.5a.75.75 0 0 0 .75-.75V1.75a.75.75 0 0 0-.75-.75zm-2.25.75C.5.784 1.284 0 2.25 0h10.5c.966 0 1.75.784 1.75 1.75v11.5A1.75 1.75 0 0 1 12.75 15H2.25A1.75 1.75 0 0 1 .5 13.25z" />
                  <path d="M4 3.75a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 0 1.5h-5.5A.75.75 0 0 1 4 3.75m0 3a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 0 1.5h-5.5A.75.75 0 0 1 4 6.75m0 3a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 0 1.5h-3.5A.75.75 0 0 1 4 9.75" />
                </svg>
              </span>
              Documentation
            </a>
            <a
              href="https://github.com/EricTsai83/optstuff"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:bg-card-hover flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors"
              tabIndex={0}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                <svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
                </svg>
              </span>
              GitHub
            </a>
          </div>
        </details>
      </div>
    </ScrollHeader>
  );
}
