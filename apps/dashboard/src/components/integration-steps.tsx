"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  {
    number: "1",
    title: "Install the package",
    description: "Add Optix to your project with a single command.",
    code: `npm install optix`,
  },
  {
    number: "2",
    title: "Add the middleware",
    description: "Import and mount the middleware in your server.",
    code: `import { createOptix } from "optix"

app.use("/img", createOptix())`,
  },
  {
    number: "3",
    title: "Update your image URLs",
    description: "Prefix your image paths with modifiers.",
    code: `<img src="/img/w_800,f_webp/photos/hero.png" />`,
  },
];

export function IntegrationSteps() {
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers = stepRefs.current.map((ref, index) => {
      if (!ref) return null;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            setVisibleSteps((prev) => [...new Set([...prev, index])]);
          }
        },
        { threshold: 0.3 },
      );

      observer.observe(ref);
      return observer;
    });

    return () => {
      observers.forEach((observer) => observer?.disconnect());
    };
  }, []);

  return (
    <section className="bg-muted/30 px-6 py-24 md:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-16 text-center">
          <p className="text-accent animate-fade-in mb-3 font-medium">
            Quick Start
          </p>
          <h2 className="text-foreground animate-fade-in-up animation-delay-100 mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Three steps to faster images
          </h2>
          <p className="text-muted-foreground animate-fade-in-up animation-delay-200 mx-auto max-w-lg">
            No complex configuration. Just install, mount, and go.
          </p>
        </div>

        <div className="relative">
          <div
            className="bg-border absolute top-12 left-6 hidden w-px transition-all duration-1000 ease-out md:block"
            style={{
              height:
                visibleSteps.length === 3
                  ? "calc(100% - 6rem)"
                  : visibleSteps.length === 2
                    ? "66%"
                    : visibleSteps.length === 1
                      ? "33%"
                      : "0%",
              opacity: visibleSteps.length > 0 ? 1 : 0,
            }}
          />

          <div className="space-y-8">
            {steps.map((step, index) => (
              <div
                key={step.number}
                ref={(el) => {
                  stepRefs.current[index] = el;
                }}
                className={`relative flex flex-col gap-6 transition-all duration-700 md:flex-row ${
                  visibleSteps.includes(index)
                    ? "translate-x-0 opacity-100"
                    : "translate-x-[-20px] opacity-0"
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="relative z-10 shrink-0">
                  <div
                    className={`bg-foreground text-background flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold transition-all duration-500 ${
                      visibleSteps.includes(index) ? "scale-100" : "scale-0"
                    }`}
                    style={{ transitionDelay: `${index * 150 + 200}ms` }}
                  >
                    {step.number}
                  </div>
                </div>

                <div className="flex-1 pb-2">
                  <h3 className="text-foreground mb-1 text-lg font-semibold">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground mb-4 text-sm">
                    {step.description}
                  </p>

                  <div className="overflow-hidden rounded-xl bg-[#18181b] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
                    <pre className="overflow-x-auto p-4">
                      <code className="font-mono text-sm text-[#a1a1aa]">
                        {step.code}
                      </code>
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
