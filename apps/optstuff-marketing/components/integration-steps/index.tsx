"use client";

import { cn } from "@workspace/ui/lib/utils";
import { Terminal } from "lucide-react";

import { SectionHeader, SectionWrapper } from "@/components/ui/section";
import { useIntersectionVisibility } from "@/hooks/use-intersection-visibility";
import { STEPS } from "./constants";
import {
  CreateProjectVisual,
  OptimizeVisual,
  SetupProjectVisual,
} from "./step-visuals";

export function IntegrationSteps() {
  const { visibleItems: visibleSteps, setItemRef: setStepRef } =
    useIntersectionVisibility<HTMLDivElement>(STEPS.length, {
      threshold: 0.2,
      once: true,
    });

  return (
    <SectionWrapper id="quickstart">
      <SectionHeader
        icon={Terminal}
        badge="Quick Start"
        title="Three steps to faster images"
        description="Get started in minutes with a simple integration."
        className="mb-12 sm:mb-20"
      />

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
                    "absolute top-10 left-4 h-[calc(100%-2.5rem)] w-0.5 transition-all duration-1000 sm:top-12 sm:left-5 sm:h-[calc(100%-3rem)] md:left-6",
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
    </SectionWrapper>
  );
}
