import type { SyntaxHighlightProps } from "../types";

export function SyntaxHighlight({ code, isResponse }: SyntaxHighlightProps) {
  if (isResponse) {
    const highlighted = code
      .replace(/"([^"]+)":/g, '<span class="text-purple-400">"$1"</span>:')
      .replace(/: "([^"]+)"/g, ': <span class="text-green-400">"$1"</span>')
      .replace(/: (\d+)/g, ': <span class="text-amber-400">$1</span>')
      .replace(/: (true|false)/g, ': <span class="text-blue-400">$1</span>');
    return (
      <span
        className="text-gray-300"
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    );
  }

  const highlighted = code
    .replace(
      /(curl|const|await|fetch|new)/g,
      '<span class="text-purple-400">$1</span>',
    )
    .replace(
      /("https?:\/\/[^"]+"|'https?:\/\/[^']+')/g,
      '<span class="text-green-400">$1</span>',
    )
    .replace(
      /(-H|headers|Authorization|Bearer)/g,
      '<span class="text-amber-400">$1</span>',
    )
    .replace(/(URLSearchParams)/g, '<span class="text-blue-400">$1</span>');

  return (
    <span
      className="text-gray-300"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}
