export type Step = {
  readonly number: string;
  readonly title: string;
  readonly description: string;
};

export type CodeTab = "curl" | "js" | "response";

export type TypewriterCodeProps = {
  readonly code: string;
  readonly isTyping: boolean;
  readonly isResponse?: boolean;
};

export type SyntaxHighlightProps = {
  readonly code: string;
  readonly isResponse?: boolean;
};
