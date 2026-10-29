"use client";

import { DOCS_LINKS } from "@/lib/constants";
import { Button } from "@workspace/ui/components/button";
import { toast } from "@workspace/ui/components/sonner";
import { ArrowUpRight, Info, Server } from "lucide-react";
import { useEffect } from "react";

const shownNotices = new Set<string>();

type DemoNoticeToastProps = {
  userId: string;
  sessionId: string;
  nextResetAt: string | null;
};

export function DemoNoticeToast({
  userId,
  sessionId,
  nextResetAt,
}: DemoNoticeToastProps) {
  const key = `optstuff:demo-notice:v3:${sessionId}:${nextResetAt ?? "protected"}`;
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (shownNotices.has(key)) return;
      try {
        if (sessionStorage.getItem(key)) return;
      } catch {
        // Storage restrictions must never prevent a user from trying the demo.
      }
      shownNotices.add(key);
      showDemoNotice(userId, nextResetAt, key);
    }, 800);
    return () => {
      window.clearTimeout(timer);
    };
  }, [userId, nextResetAt, key]);
  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-muted-foreground hover:text-foreground h-8 gap-1.5 px-2 text-sm"
      onClick={() => showDemoNotice(userId, nextResetAt, key)}
    >
      <Info className="size-3.5" aria-hidden="true" />
      Demo notice
    </Button>
  );
}

/** Manual access always works, even after the automatic reminder was dismissed. */
function showDemoNotice(
  userId: string,
  nextResetAt: string | null,
  key: string,
): void {
  const id = `demo-notice:${userId}`;
  function dismiss() {
    try {
      sessionStorage.setItem(key, "1");
    } catch {
      // The in-memory guard still prevents repeated automatic reminders.
    }
    toast.dismiss(id);
  }
  toast.custom(
    () => (
      <section
        aria-label="About this demo"
        className="bg-popover text-popover-foreground border-border relative w-full rounded-xl border p-5 shadow-lg"
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-wider text-amber-700 dark:text-amber-400">
            <span
              className="size-1.5 rounded-full bg-current"
              aria-hidden="true"
            />
            Public demo
          </span>
          <span className="text-muted-foreground text-xs">
            14-day data window
          </span>
        </div>
        <h2 className="mb-1.5 text-sm font-semibold tracking-tight">
          A place to try OptStuff.
        </h2>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Demo workspaces have a 14-day window from the first visit. Expired
          data is cleared on your next visit or by scheduled cleanup. Your
          account stays, and you can always start fresh with another 14 days.
          For lasting projects, we encourage self-hosting.
        </p>
        {nextResetAt ? (
          <p className="text-muted-foreground mt-3 border-t pt-3 text-xs">
            Current window ends{" "}
            <time
              dateTime={nextResetAt}
              className="text-foreground font-medium"
            >
              {new Intl.DateTimeFormat(undefined, {
                dateStyle: "medium",
              }).format(new Date(nextResetAt))}
            </time>
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <Button size="sm" variant="outline" className="h-8 text-xs" asChild>
            <a
              href={DOCS_LINKS.selfHosting}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Server className="size-3.5" aria-hidden="true" />
              Self-host OptStuff
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground h-8 text-xs"
            onClick={dismiss}
          >
            Got it
          </Button>
        </div>
      </section>
    ),
    { id, position: "bottom-left", duration: Infinity, dismissible: false },
  );
}
