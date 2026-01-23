"use client";

import { CopyButton } from "@workspace/ui/components/copy-button";
import { RevealButton } from "@workspace/ui/components/reveal-button";
import { cn } from "@workspace/ui/lib/utils";
import { useState } from "react";

/**
 * Base props shared by all CodeBlock variants
 */
type CodeBlockBaseProps = {
  readonly content: string;
  readonly className?: string;
  /**
   * - `inline`: Single-line style, action buttons on the right (ideal for short API URLs)
   * - `block`: Multi-line block style, action buttons at top-right (ideal for longer code)
   */
  readonly variant?: "inline" | "block";
  /**
   * Language identifier (currently metadata only, may support syntax highlighting in the future)
   */
  readonly language?: string;
};

/**
 * Props when content should be masked (e.g., API keys)
 */
type RevealableProps = {
  readonly revealable: true;
  /**
   * Prefix to keep visible when masked (used when revealable is true)
   * @example "sk_live_" will display as "sk_live_••••••••"
   */
  readonly maskPrefix?: string;
};

/**
 * Props when content is always visible
 */
type NonRevealableProps = {
  readonly revealable?: false;
  readonly maskPrefix?: never;
};

type CodeBlockProps = CodeBlockBaseProps &
  (RevealableProps | NonRevealableProps);

const MASK_CHARACTER = "•";

const containerStyles = {
  base: "border-border rounded-xl border bg-[#18181b]",
  inline: "flex items-center justify-between gap-4 px-4 py-1",
  block: "relative",
} as const;

const codeStyles = {
  base: "text-accent-foreground scrollbar-hide min-w-0 overflow-x-auto font-mono text-sm",
  inline: "flex-1 text-nowrap",
  block: "block whitespace-pre-wrap px-4 py-3 pr-16",
} as const;

const actionButtonsStyles = {
  base: "flex items-center gap-1",
  block: "absolute right-2 top-2",
} as const;

/**
 * Creates masked content by replacing characters after the prefix with mask characters
 */
function createMaskedContent(content: string, prefix: string): string {
  const secretPart = content.slice(prefix.length);
  return prefix + MASK_CHARACTER.repeat(secretPart.length);
}

/**
 * A block component for displaying code or sensitive information
 *
 * @example
 * // Basic usage
 * <CodeBlock content="npm install @workspace/ui" />
 *
 * @example
 * // Multi-line code
 * <CodeBlock content={codeSnippet} variant="block" />
 *
 * @example
 * // Revealable API Key
 * <CodeBlock
 *   content="sk_live_abc123xyz"
 *   revealable
 *   maskPrefix="sk_live_"
 * />
 */
export function CodeBlock({
  content,
  className,
  variant = "inline",
  revealable = false,
  maskPrefix = "",
}: CodeBlockProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  const shouldMask = revealable && !isRevealed;
  const displayContent = shouldMask
    ? createMaskedContent(content, maskPrefix)
    : content;

  const isInline = variant === "inline";
  const isBlock = variant === "block";

  return (
    <div
      className={cn(
        containerStyles.base,
        isInline && containerStyles.inline,
        isBlock && containerStyles.block,
        className,
      )}
      role="region"
      aria-label="Code block"
    >
      <code
        className={cn(
          codeStyles.base,
          isInline && codeStyles.inline,
          isBlock && codeStyles.block,
        )}
      >
        {displayContent}
      </code>

      <div
        className={cn(
          actionButtonsStyles.base,
          isBlock && actionButtonsStyles.block,
        )}
      >
        {revealable && (
          <RevealButton revealed={isRevealed} onRevealChange={setIsRevealed} />
        )}
        <CopyButton text={content} className="hover:border-none" />
      </div>
    </div>
  );
}
