export type Step = {
  readonly number: string;
  readonly title: string;
  readonly description: string;
};

export type CodeTab = "signedUrl" | "server" | "headers";

export type TypewriterCodeProps = {
  readonly code: string;
  readonly variant: CodeTab;
  readonly copied?: boolean;
  readonly onCopy?: () => void | Promise<void>;
};

export type SyntaxHighlightProps = {
  readonly code: string;
  readonly variant: CodeTab;
};
