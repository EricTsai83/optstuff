import { codeToHtml } from "shiki";

/**
 * Server-only: highlight code with Shiki using CSS variables for theme switching.
 *
 * Returns an HTML string containing `<pre><code>` with inline styles that
 * reference `--shiki-light` / `--shiki-dark` CSS variables, so a single
 * render works for both light and dark mode without any client JS.
 */
export async function highlightCode(
  code: string,
  lang: string,
): Promise<string> {
  return codeToHtml(code, {
    lang,
    themes: {
      light: "github-light",
      dark: "github-dark",
    },
  });
}
