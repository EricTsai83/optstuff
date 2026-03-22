import { parseCodeBlockAttributes } from "fumadocs-core/mdx-plugins";

type RemarkNode = {
  type: string;
  lang?: string | null;
  meta?: string | null;
  value?: string;
  children?: RemarkNode[];
};

function visitNodes(node: RemarkNode, visitor: (n: RemarkNode) => void): void {
  visitor(node);
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      visitNodes(child, visitor);
    }
  }
}

/**
 * Like `remarkMdxMermaid` from fumadocs-core, but forwards optional meta:
 * `title="..."` (short figure title) and `caption="..."` (optional reading note for the preview toolbar).
 *
 * @example
 * ```mermaid title="Request pipeline" caption="Arrows follow request order."
 * flowchart TD ...
 * ```
 */
export function remarkMdxMermaidWithTitle(options: { lang?: string } = {}) {
  const { lang = "mermaid" } = options;
  return (tree: RemarkNode) => {
    visitNodes(tree, (node) => {
      if (node.type !== "code") return;
      if (node.lang !== lang || !node.value) return;

      const meta = typeof node.meta === "string" ? node.meta : "";
      const { attributes } = parseCodeBlockAttributes(meta, ["title", "caption"]);
      const title = attributes.title;
      const caption = attributes.caption;

      const jsxAttrs: Array<{
        type: "mdxJsxAttribute";
        name: string;
        value: string | null;
      }> = [
        {
          type: "mdxJsxAttribute",
          name: "chart",
          value: node.value.trim(),
        },
      ];
      if (typeof title === "string" && title.length > 0) {
        jsxAttrs.push({
          type: "mdxJsxAttribute",
          name: "title",
          value: title,
        });
      }
      if (typeof caption === "string" && caption.length > 0) {
        jsxAttrs.push({
          type: "mdxJsxAttribute",
          name: "caption",
          value: caption,
        });
      }

      Object.assign(node, {
        type: "mdxJsxFlowElement",
        name: "Mermaid",
        attributes: jsxAttrs,
        children: [],
      });
    });
  };
}
