import { Mermaid } from "@/components/fumadocs-mermaid";
import { FrameworkCard, FrameworkGrid } from "@/components/mdx/framework-grid";
import { GetStartedButton } from "@/components/mdx/get-started-button";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    Mermaid,
    FrameworkGrid,
    FrameworkCard,
    GetStartedButton,
    ...components,
  };
}
