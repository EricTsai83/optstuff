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
 * Like `remarkMdxMermaid` from fumadocs-core, but forwards optional
 * `title="..."` from the fenced code block meta to `<Mermaid title="..." />`.
 *
 * @example
 * ```mermaid title="Request pipeline"
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
      const { attributes } = parseCodeBlockAttributes(meta, ["title"]);
      const title = attributes.title;

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

      Object.assign(node, {
        type: "mdxJsxFlowElement",
        name: "Mermaid",
        attributes: jsxAttrs,
        children: [],
      });
    });
  };
}
