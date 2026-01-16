"use client";

import { Code2 } from "lucide-react";
import { ApiDemoSection } from "./integration-steps/api-demo";

export function ApiDemo() {
  return (
    <section
      id="api"
      className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24 md:px-8"
    >
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0">
        <div className="bg-accent/5 absolute right-1/4 top-1/3 h-64 w-64 rounded-full blur-3xl sm:h-96 sm:w-96" />
        <div className="bg-accent/3 absolute bottom-1/3 left-1/4 h-48 w-48 rounded-full blur-3xl sm:h-64 sm:w-64" />
      </div>

      <div className="relative mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center sm:mb-12">
          <div className="animate-fade-in border-accent/30 bg-accent/10 text-accent mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium sm:px-4 sm:text-sm">
            <Code2 className="h-3 w-3 sm:h-4 sm:w-4" />
            API Reference
          </div>
          <h2 className="text-foreground animate-fade-in-up animation-delay-100 mb-3 text-2xl font-bold tracking-tight sm:mb-4 sm:text-3xl md:text-4xl lg:text-5xl">
            Simple API, Powerful Results
          </h2>
          <p className="text-muted-foreground animate-fade-in-up animation-delay-200 mx-auto max-w-2xl text-sm sm:text-base md:text-lg">
            Transform your images with a single API call.
          </p>
        </div>

        {/* API Demo Section */}
        <div className="animate-fade-in-up animation-delay-300">
          <ApiDemoSection />
        </div>
      </div>
    </section>
  );
}
