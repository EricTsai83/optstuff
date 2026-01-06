"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { useEffect, useState } from "react";

export function ThemeToggleButton() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [hasToggled, setHasToggled] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  function handleClick(): void {
    setHasToggled(true);
    setTheme(isDark ? "light" : "dark");
  }

  // 避免 hydration 不匹配，在 mount 之前不渲染圖標
  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="toggle theme"
        className="border-border bg-secondary relative flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border"
      >
        {/* Skeleton placeholder with pulse animation */}
        <span className="bg-muted-foreground/20 h-4 w-4 animate-pulse rounded-full" />
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={isDark ? "toggle to light mode" : "toggle to dark mode"}
      className={cn(
        "border-border bg-secondary hover:border-accent hover:bg-accent/10 hover:text-accent focus-visible:ring-ring focus-visible:ring-offset-background relative flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border  focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        isDark
          ? "text-accent-foreground"
          : "text-muted-foreground dark:text-accent-foreground",
      )}
      onClick={handleClick}
    >
      <Sun
        className={cn(
          "absolute h-4 w-4",
          hasToggled &&
            (isDark
              ? "animate-theme-toggle-icon-out"
              : "animate-theme-toggle-icon-in"),
          !hasToggled && isDark && "opacity-0 scale-0",
        )}
      />
      <Moon
        className={cn(
          "absolute h-4 w-4",
          hasToggled &&
            (isDark
              ? "animate-theme-toggle-icon-in"
              : "animate-theme-toggle-icon-out"),
          !hasToggled && !isDark && "opacity-0 scale-0",
        )}
      />
    </button>
  );
}
