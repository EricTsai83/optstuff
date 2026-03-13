const NEXTJS_DOCS_URL =
  "https://docs-optstuff.vercel.app/getting-started/integrate-nextjs";

export const NAV_LINKS = [
  {
    href: "#demo",
    label: "Demo",
    mobileIconClassName:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    mobileIconPath:
      "m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z",
  },
  {
    href: "#patterns",
    label: "Patterns",
    mobileIconClassName:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    mobileIconPath:
      "M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5",
  },
  {
    href: "#how-it-works",
    label: "How it works",
    mobileIconClassName:
      "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
    mobileIconPath:
      "M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z",
  },
  {
    href: "#playground",
    label: "Playground",
    mobileIconClassName:
      "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
    mobileIconPath:
      "m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 17.25V6.75A2.25 2.25 0 0 0 18.75 4.5H5.25A2.25 2.25 0 0 0 3 6.75v10.5A2.25 2.25 0 0 0 5.25 20Z",
  },
] as const;

export const RESOURCE_LINKS = [
  {
    href: NEXTJS_DOCS_URL,
    desktopLabel: "Docs",
    mobileLabel: "Documentation",
    iconViewBox: "0 0 16 16",
    iconPaths: [
      "M2.75 1a.75.75 0 0 0-.75.75v11.5c0 .138.112.25.25.25h10.5a.75.75 0 0 0 .75-.75V1.75a.75.75 0 0 0-.75-.75zm-2.25.75C.5.784 1.284 0 2.25 0h10.5c.966 0 1.75.784 1.75 1.75v11.5A1.75 1.75 0 0 1 12.75 15H2.25A1.75 1.75 0 0 1 .5 13.25z",
      "M4 3.75a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 0 1.5h-5.5A.75.75 0 0 1 4 3.75m0 3a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 0 1.5h-5.5A.75.75 0 0 1 4 6.75m0 3a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 0 1.5h-3.5A.75.75 0 0 1 4 9.75",
    ],
    mobileIconClassName:
      "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  },
  {
    href: "https://github.com/EricTsai83/optstuff",
    desktopLabel: "GitHub",
    mobileLabel: "GitHub",
    iconViewBox: "0 0 16 16",
    iconPaths: [
      "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z",
    ],
    mobileIconClassName:
      "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  },
] as const;
