"use client";

import { useState } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@workspace/ui/components/tabs";
import { CodeBlock } from "@workspace/ui/components/code-block";

const codeExamples = {
  url: `// Simple URL-based API
const imageUrl = "https://optix.io/s_400x300,f_webp,q_80/your-image.jpg"

// With fit mode
const cropped = "https://optix.io/s_400x300,fit_cover,f_webp/image.jpg"

// Apply effects
const blurred = "https://optix.io/blur_5,grayscale/image.jpg"`,

  express: `import { createIPX, createIPXMiddleware } from "ipx";

const ipx = createIPX({
  storage: ipxLocalStorage(),
  httpStorage: ipxHttpStorage({ domains: ["example.com"] }),
});

app.use("/image", createIPXMiddleware(ipx));`,

  next: `// next.config.js
module.exports = {
  images: {
    loader: 'custom',
    loaderFile: './image-loader.js',
  },
}

// image-loader.js
export default function optixLoader({ src, width, quality }) {
  return \`https://optix.io/s_\${width},q_\${quality || 80},f_webp/\${src}\`
}`,
};

export function CodeExample() {
  const [activeTab, setActiveTab] = useState("url");

  return (
    <section id="docs" className="bg-muted/30 py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-16 text-center">
          <p className="text-accent mb-3 font-medium">Integration</p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Easy to integrate
          </h2>
          <p className="text-muted-foreground mx-auto max-w-lg">
            Works with any stack. Choose your preferred method.
          </p>
        </div>

        <div className="mx-auto max-w-3xl">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="mb-4">
              <TabsList className="bg-muted h-10 rounded-full p-1">
                <TabsTrigger
                  value="url"
                  className="data-[state=active]:bg-background rounded-full px-4 text-sm data-[state=active]:shadow-sm"
                >
                  URL API
                </TabsTrigger>
                <TabsTrigger
                  value="express"
                  className="data-[state=active]:bg-background rounded-full px-4 text-sm data-[state=active]:shadow-sm"
                >
                  Express.js
                </TabsTrigger>
                <TabsTrigger
                  value="next"
                  className="data-[state=active]:bg-background rounded-full px-4 text-sm data-[state=active]:shadow-sm"
                >
                  Next.js
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="url" className="mt-0">
              <CodeBlock content={codeExamples.url} variant="block" />
            </TabsContent>
            <TabsContent value="express" className="mt-0">
              <CodeBlock content={codeExamples.express} variant="block" />
            </TabsContent>
            <TabsContent value="next" className="mt-0">
              <CodeBlock content={codeExamples.next} variant="block" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}
