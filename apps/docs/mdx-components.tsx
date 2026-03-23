import defaultMdxComponents from "fumadocs-ui/mdx";
import { Mermaid } from "@/components/fumadocs-mermaid";
import {
  FrameworkGrid,
  FrameworkCard,
} from "@/components/mdx/framework-grid";
import type { MDXComponents } from "mdx/types";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    Mermaid,
    FrameworkGrid,
    FrameworkCard,
    ...components,
  };
}
