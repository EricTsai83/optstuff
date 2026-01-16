"use client";

import { Terminal } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

import { STEPS } from "./constants";
import { useStepVisibility } from "./hooks";
import {
  CreateProjectVisual,
  SetupProjectVisual,
  OptimizeVisual,
} from "./step-visuals";

export function IntegrationSteps() {
  const { visibleSteps, setStepRef } = useStepVisibility(STEPS.length);

  return (
    <section
      id="quickstart"
      className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24 md:px-8"
    >
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0">
        <div className="bg-accent/5 absolute left-1/4 top-1/4 h-64 w-64 rounded-full blur-3xl sm:h-96 sm:w-96" />
        <div className="bg-accent/3 absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full blur-3xl sm:h-64 sm:w-64" />
      </div>

      <div className="relative mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center sm:mb-20">
          <div className="animate-fade-in border-accent/30 bg-accent/10 text-accent mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium sm:px-4 sm:text-sm">
            <Terminal className="h-3 w-3 sm:h-4 sm:w-4" />
            Quick Start
          </div>
          <h2 className="text-foreground animate-fade-in-up animation-delay-100 mb-3 text-2xl font-bold tracking-tight sm:mb-4 sm:text-3xl md:text-4xl lg:text-5xl">
            Three steps to faster images
          </h2>
          <p className="text-muted-foreground animate-fade-in-up animation-delay-200 mx-auto max-w-2xl text-sm sm:text-base md:text-lg">
            Get started in minutes with a simple integration.
          </p>
        </div>

        {/* Vertical timeline */}
        <div className="relative">
          {STEPS.map((step, index) => {
            const isVisible = visibleSteps.has(index);
            const isLast = index === STEPS.length - 1;

            return (
              <div
                key={step.number}
                ref={setStepRef(index)}
                className={cn(
                  "relative transition-all duration-700",
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-12 opacity-0",
                  !isLast && "pb-12 sm:pb-16",
                )}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                {/* Connecting line */}
                {!isLast && (
                  <div
                    className={cn(
                      "absolute left-4 top-10 h-[calc(100%-2.5rem)] w-0.5 transition-all duration-1000 sm:left-5 sm:top-12 sm:h-[calc(100%-3rem)] md:left-6",
                      isVisible ? "bg-accent/30" : "bg-border/30",
                    )}
                    style={{ transitionDelay: `${index * 200 + 300}ms` }}
                  />
                )}

                {/* Step content */}
                <div className="flex gap-4 sm:gap-6 md:gap-8">
                  {/* Left: Step number */}
                  <div className="relative z-10 shrink-0">
                    <div
                      className={cn(
                        "bg-accent text-accent-foreground flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold shadow-lg transition-all duration-500 sm:h-10 sm:w-10 sm:rounded-xl sm:text-base md:h-12 md:w-12 md:text-lg",
                        isVisible ? "scale-100" : "scale-0",
                      )}
                      style={{
                        transitionDelay: `${index * 200 + 100}ms`,
                        boxShadow: isVisible
                          ? "0 0 30px hsl(var(--accent) / 0.3)"
                          : "none",
                      }}
                    >
                      {step.number}
                    </div>
                  </div>

                  {/* Right: Title + Demo */}
                  <div className="min-w-0 flex-1">
                    {/* Title area */}
                    <div className="mb-3 sm:mb-4">
                      <h3 className="text-foreground text-lg font-bold sm:text-xl md:text-2xl">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground mt-0.5 text-xs sm:mt-1 sm:text-sm">
                        {step.description}
                      </p>
                    </div>

                    {/* Demo area */}
                    <div
                      className={cn(
                        "border-border/50 bg-card/50 overflow-hidden rounded-xl border backdrop-blur-sm transition-all duration-500 sm:rounded-2xl",
                        // Third step's OptimizeVisual needs more height on mobile devices
                        index === 2
                          ? "h-[200px] sm:h-[180px] md:h-[220px]"
                          : "h-[140px] sm:h-[180px] md:h-[220px]",
                        isVisible
                          ? "translate-x-0 opacity-100"
                          : "translate-x-8 opacity-0",
                      )}
                      style={{ transitionDelay: `${index * 200 + 200}ms` }}
                    >
                      <div className="h-full p-2 sm:p-4 md:p-5">
                        {index === 0 && <CreateProjectVisual />}
                        {index === 1 && <SetupProjectVisual />}
                        {index === 2 && <OptimizeVisual />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
