"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { copyToClipboard } from "@/lib/clipboard";

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
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={className}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
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
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`hover:text-foreground transition-colors ${className}`}
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </button>
  );
}
