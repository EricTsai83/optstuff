import type { SyntaxHighlightProps } from "../types";

function escapeHtml(code: string): string {
  return code
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function highlightUrl(code: string): string {
  return code
    .replace(
      /(https:\/\/[A-Za-z0-9./_-]+)/g,
      '<span class="text-emerald-300">$1</span>',
    )
    .replace(/(\/api\/v1\/)/g, '<span class="text-sky-300">$1</span>')
    .replace(
      /\b(w_\d+|q_\d+|f_[a-z0-9]+)\b/g,
      '<span class="text-amber-300">$1</span>',
    )
    .replace(
      /\b(key|sig|exp)(=)/g,
      '<span class="text-sky-200">$1</span>$2',
    )
    .replace(
      /\b(pk_[A-Za-z0-9_]+)\b/g,
      '<span class="text-cyan-300">$1</span>',
    )
    .replace(
      /\b([A-Za-z0-9_-]{32})\b/g,
      '<span class="text-blue-300">$1</span>',
    );
}

function highlightServer(code: string): string {
  return code
    .replace(
      /\b(import|const|new|return)\b/g,
      '<span class="text-sky-300">$1</span>',
    )
    .replace(
      /(".*?"|`.*?`)/g,
      '<span class="text-emerald-300">$1</span>',
    )
    .replace(
      /\b(createHmac|URLSearchParams|update|digest|substring|String)\b/g,
      '<span class="text-cyan-300">$1</span>',
    )
    .replace(
      /\b(path|payload|sig|url|exp|key)\b/g,
      '<span class="text-amber-300">$1</span>',
    )
    .replace(
      /\b(base64url|sha256|pk_demo_123)\b/g,
      '<span class="text-blue-300">$1</span>',
    );
}

function highlightHeaders(code: string): string {
  return code
    .replace(
      /^(HTTP\/1\.1 200 OK)$/g,
      '<span class="text-emerald-300">$1</span>',
    )
    .replace(
      /^([A-Za-z-]+)(:)/g,
      '<span class="text-sky-300">$1</span>$2',
    )
    .replace(
      /\b(image\/webp|Accept|immutable)\b/g,
      '<span class="text-cyan-300">$1</span>',
    )
    .replace(
      /\b(\d+ms|dur=\d+|\d{3})\b/g,
      '<span class="text-amber-300">$1</span>',
    );
}

export function SyntaxHighlight({ code, variant }: SyntaxHighlightProps) {
  const escaped = escapeHtml(code);

  const highlighted =
    variant === "signedUrl"
      ? highlightUrl(escaped)
      : variant === "server"
        ? highlightServer(escaped)
        : highlightHeaders(escaped);

  return (
    <span
      className="text-slate-200"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}
