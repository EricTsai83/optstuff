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

type MdxJsxAttribute = {
  type: "mdxJsxAttribute";
  name: string;
  value: string | null;
};

function jsxStringAttr(name: string, value: string): MdxJsxAttribute {
  return { type: "mdxJsxAttribute", name, value };
}

/**
 * Like `remarkMdxMermaid` from `fumadocs-mermaid`, but forwards optional meta:
 * `title="..."` and `caption="..."` for the diagram block.
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

      const jsxAttrs: MdxJsxAttribute[] = [
        jsxStringAttr("chart", node.value.trim()),
      ];
      for (const key of ["title", "caption"] as const) {
        const v = attributes[key];
        if (typeof v === "string" && v.length > 0) {
          jsxAttrs.push(jsxStringAttr(key, v));
        }
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
