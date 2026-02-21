"use client";

import type { ReactNode } from "react";
import { CopyButton } from "@workspace/ui/components/copy-button";
import { RevealButton } from "@workspace/ui/components/reveal-button";
import { cn } from "@workspace/ui/lib/utils";
import { useState } from "react";

/* ---------------------------------------------------------------------------
 * Masking
 * --------------------------------------------------------------------------- */

const MASK_CHARACTER = "•";

function createMaskedContent(content: string, prefix: string): string {
  const secretPart = content.slice(prefix.length);
  return prefix + MASK_CHARACTER.repeat(secretPart.length);
}

/* ---------------------------------------------------------------------------
 * Types
 * --------------------------------------------------------------------------- */

type RevealableProps = {
  readonly revealable: true;
  /**
   * Prefix to keep visible when masked.
   * @example "sk_live_" → displays as "sk_live_••••••••"
   */
  readonly maskPrefix?: string;
};

type NonRevealableProps = {
  readonly revealable?: false;
  readonly maskPrefix?: never;
};

type CodeBlockProps = {
  /** String content to display. Ignored when `children` is provided. */
  readonly content?: string;
  /** Custom JSX to render inside the code element. Takes precedence over `content`. */
  readonly children?: ReactNode;
  readonly className?: string;
  /**
   * Override the text used by the copy button.
   * Defaults to `content`. Required when using `children` without `content`.
   */
  readonly copyText?: string;
  /**
   * - `inline`: Single-line, action buttons on the right (ideal for short URLs)
   * - `block`: Multi-line, action buttons at top-right (ideal for code snippets)
   * @default "inline"
   */
  readonly variant?: "inline" | "block";
  /**
   * Block variant only — prevents line wrapping and enables horizontal scroll.
   * @default false
   */
  readonly nowrap?: boolean;
  /**
   * Whether to show the copy button.
   * @default true
   */
  readonly showCopy?: boolean;
  /** Language identifier (metadata only, reserved for future syntax highlighting). */
  readonly language?: string;
} & (RevealableProps | NonRevealableProps);

/* ---------------------------------------------------------------------------
 * Component
 * --------------------------------------------------------------------------- */

/**
 * A styled block for displaying code or sensitive information.
 *
 * @example
 * // Inline (default) — ideal for short URLs or commands
 * <CodeBlock content="npm install @workspace/ui" />
 *
 * @example
 * // Block with wrapping — ideal for multi-line code
 * <CodeBlock content={codeSnippet} variant="block" />
 *
 * @example
 * // Block without wrapping — horizontal scroll when content overflows
 * <CodeBlock content={envVars} variant="block" nowrap />
 *
 * @example
 * // Revealable secret — masked by default with toggle
 * <CodeBlock content="sk_live_abc123xyz" revealable maskPrefix="sk_live_" />
 *
 * @example
 * // Separate display vs copy content
 * <CodeBlock content={maskedContent} copyText={realContent} variant="block" nowrap />
 *
 * @example
 * // Custom JSX content
 * <CodeBlock copyText={rawCode} variant="block">
 *   <span className="text-blue-400">const</span> x = 1;
 * </CodeBlock>
 *
 * @example
 * // Without copy button
 * <CodeBlock content="read-only snippet" showCopy={false} />
 */
export function CodeBlock({
  content,
  children,
  className,
  copyText,
  variant = "inline",
  nowrap = false,
  showCopy = true,
  revealable = false,
  maskPrefix = "",
}: CodeBlockProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  const isBlock = variant === "block";
  const hasActions = showCopy || revealable;

  const shouldMask = revealable && !isRevealed && content;
  const displayContent = shouldMask
    ? createMaskedContent(content, maskPrefix)
    : content;

  const textToCopy = copyText ?? content ?? "";

  return (
    <div
      className={cn(
        "border-border w-full max-w-full overflow-hidden rounded-xl border bg-[#18181b]",
        isBlock
          ? "relative"
          : "flex items-center justify-between gap-4 px-4 py-1",
        className,
      )}
      role="region"
      aria-label="Code block"
    >
      <code
        className={cn(
          "text-accent-foreground min-w-0 overflow-x-auto font-mono text-sm",
          isBlock
            ? cn(
                "block px-4 py-3",
                nowrap
                  ? "whitespace-pre"
                  : "scrollbar-hide whitespace-pre-wrap",
                hasActions && "pr-16",
              )
            : "scrollbar-hide flex-1 text-nowrap",
        )}
      >
        {children ?? displayContent}
      </code>

      {hasActions && (
        <div
          className={cn(
            "flex items-center gap-1",
            isBlock && "absolute right-2 top-2",
          )}
        >
          {revealable && (
            <RevealButton
              revealed={isRevealed}
              onRevealChange={setIsRevealed}
            />
          )}
          {showCopy && (
            <CopyButton text={textToCopy} className="hover:border-none" />
          )}
        </div>
      )}
    </div>
  );
}
