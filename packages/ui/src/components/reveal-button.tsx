"use client";

import { cn } from "@workspace/ui/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type RevealButtonProps = {
  readonly revealed?: boolean;
  readonly defaultRevealed?: boolean;
  readonly onRevealChange?: (revealed: boolean) => void;
  readonly className?: string;
};

/**
 * A toggle button to reveal/hide sensitive content like API keys.
 * Supports both controlled and uncontrolled modes.
 */
export function RevealButton({
  revealed,
  defaultRevealed = false,
  onRevealChange,
  className,
}: RevealButtonProps) {
  const [internalRevealed, setInternalRevealed] = useState(defaultRevealed);

  const isControlled = revealed !== undefined;
  const isRevealed = isControlled ? revealed : internalRevealed;

  const handleToggle = (): void => {
    if (!isControlled) {
      setInternalRevealed((prev) => !prev);
    }
    onRevealChange?.(!isRevealed);
  };

  return (
    <button
      onClick={handleToggle}
      type="button"
      aria-label={isRevealed ? "Hide" : "Reveal"}
      aria-pressed={isRevealed}
      className={cn(
        "relative inline-flex items-center justify-center",
        "h-9 w-9 rounded-md",
        "hover:border-border hover:cursor-pointer hover:border",
        "active:scale-95",
        "text-accent-foreground",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        className,
      )}
    >
      <Eye
        className={cn(
          "h-4 w-4 transition-all duration-300",
          isRevealed ? "scale-0 opacity-0" : "scale-100 opacity-100",
        )}
      />
      <EyeOff
        className={cn(
          "absolute h-4 w-4 transition-all duration-300",
          isRevealed ? "scale-100 opacity-100" : "scale-0 opacity-0",
        )}
      />
      <span className="sr-only">{isRevealed ? "Hide" : "Reveal"}</span>
    </button>
  );
}
