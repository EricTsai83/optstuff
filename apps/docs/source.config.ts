import { metaSchema, pageSchema } from "fumadocs-core/source/schema";
import { remarkMdxMermaidWithTitle } from "./components/fumadocs-mermaid/remark-mdx-mermaid-with-title";
import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import lastModified from "fumadocs-mdx/plugins/last-modified";

// You can customise Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: pageSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [remarkMdxMermaidWithTitle],
  },
  plugins: [lastModified()],
});
