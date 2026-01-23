"use client";

import { copyToClipboard } from "@/lib/clipboard";
import { Button } from "@workspace/ui/components/button";
import { Check, Copy, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type CopyStatus = "idle" | "copied" | "error";

type CopyButtonProps = {
  readonly text: string;
  readonly variant?: "default" | "outline" | "ghost" | "secondary";
  readonly size?: "default" | "sm" | "lg" | "icon";
  readonly className?: string;
};

export function CopyButton({
  text,
  variant = "outline",
  size = "icon",
  className,
}: CopyButtonProps) {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    try {
      await copyToClipboard(text);
      setStatus("copied");
      timeoutRef.current = setTimeout(() => setStatus("idle"), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      setStatus("error");
      timeoutRef.current = setTimeout(() => setStatus("idle"), 2000);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={className}
    >
      {status === "copied" ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : status === "error" ? (
        <X className="h-4 w-4 text-red-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}

type CopyIconProps = {
  readonly text: string;
  readonly className?: string;
};

export function CopyIcon({ text, className }: CopyIconProps) {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    try {
      await copyToClipboard(text);
      setStatus("copied");
      timeoutRef.current = setTimeout(() => setStatus("idle"), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      setStatus("error");
      timeoutRef.current = setTimeout(() => setStatus("idle"), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`hover:text-foreground transition-colors ${className}`}
    >
      {status === "copied" ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : status === "error" ? (
        <X className="h-3 w-3 text-red-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </button>
  );
}
