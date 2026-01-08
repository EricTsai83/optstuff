"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { CodeBlock } from "@workspace/ui/components/code-block";

type Step = {
  readonly number: string;
  readonly title: string;
  readonly description: string;
  readonly code: string;
};

const STEPS: readonly Step[] = [
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
] as const;

const ANIMATION_DELAY_MS = 150;
const CIRCLE_SIZE_PX = 48;
const LINE_TRANSITION_DURATION_MS = 500;
const LINE_CALCULATION_DELAY_MS = 300;

export function IntegrationSteps() {
  const { visibleSteps, stepRefs, setStepRef } = useStepVisibility(
    STEPS.length,
  );
  const { lineHeight, containerRef } = useConnectingLineHeight(
    stepRefs,
    visibleSteps,
  );

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

        <div ref={containerRef} className="relative">
          {/* 連接線 - 跟隨動畫逐步延長 */}
          <div
            className="bg-border/60 absolute left-6 hidden w-0.5 md:block"
            style={{
              top: CIRCLE_SIZE_PX / 2,
              height: lineHeight,
              opacity: visibleSteps.size > 0 ? 1 : 0,
              transitionProperty: "height, opacity",
              transitionDuration: `${LINE_TRANSITION_DURATION_MS}ms`,
              transitionTimingFunction: "linear",
            }}
            aria-hidden="true"
          />

          <div className="space-y-8">
            {STEPS.map((step, index) => {
              const isVisible = visibleSteps.has(index);

              return (
                <div
                  key={step.number}
                  ref={setStepRef(index)}
                  className={`relative flex flex-col gap-6 transition-all duration-600 md:flex-row ${
                    isVisible
                      ? "translate-x-0 opacity-100"
                      : "translate-x-[-20px] opacity-0"
                  }`}
                  style={{ transitionDelay: `${index * ANIMATION_DELAY_MS}ms` }}
                >
                  <StepCard step={step} index={index} isVisible={isVisible} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

type StepCardProps = {
  readonly step: Step;
  readonly index: number;
  readonly isVisible: boolean;
};

function StepCard({ step, index, isVisible }: StepCardProps) {
  const circleDelay = `${index * ANIMATION_DELAY_MS + 200}ms`;

  return (
    <>
      <div className="relative z-10 shrink-0">
        <div
          className={`bg-foreground text-background flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold transition-all duration-500 ${
            isVisible ? "scale-100" : "scale-0"
          }`}
          style={{ transitionDelay: circleDelay }}
        >
          {step.number}
        </div>
      </div>

      <div className="flex-1 pb-2">
        <h3 className="text-foreground mb-1 text-lg font-semibold">
          {step.title}
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">{step.description}</p>
        <CodeBlock code={step.code} variant="block" />
      </div>
    </>
  );
}

function useStepVisibility(stepCount: number) {
  const [visibleSteps, setVisibleSteps] = useState<Set<number>>(new Set());
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  const setStepRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      stepRefs.current[index] = el;
    },
    [],
  );

  useEffect(() => {
    const observers = stepRefs.current.map((ref, index) => {
      if (!ref) return null;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            setVisibleSteps((prev) => new Set([...prev, index]));
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
  }, [stepCount]);

  return { visibleSteps, stepRefs, setStepRef };
}

function useConnectingLineHeight(
  stepRefs: React.RefObject<(HTMLDivElement | null)[]>,
  visibleSteps: Set<number>,
) {
  const [lineHeight, setLineHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const calculateLineHeight = (): void => {
      if (visibleSteps.size === 0 || !containerRef.current) {
        setLineHeight(0);
        return;
      }

      const maxVisibleIndex = Math.max(...visibleSteps);
      const firstStepEl = stepRefs.current[0];
      const lastVisibleStepEl = stepRefs.current[maxVisibleIndex];

      if (!firstStepEl || !lastVisibleStepEl) {
        setLineHeight(0);
        return;
      }

      const containerRect = containerRef.current.getBoundingClientRect();
      const firstRect = firstStepEl.getBoundingClientRect();
      const lastRect = lastVisibleStepEl.getBoundingClientRect();

      // 計算從第一個圓心到最後一個可見圓心的距離
      const firstCircleCenter =
        firstRect.top - containerRect.top + CIRCLE_SIZE_PX / 2;
      const lastCircleCenter =
        lastRect.top - containerRect.top + CIRCLE_SIZE_PX / 2;

      setLineHeight(Math.max(0, lastCircleCenter - firstCircleCenter));
    };

    // 延遲計算，等待圓圈動畫開始後才延長線條
    const timeoutId = setTimeout(
      calculateLineHeight,
      LINE_CALCULATION_DELAY_MS,
    );

    window.addEventListener("resize", calculateLineHeight);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", calculateLineHeight);
    };
  }, [visibleSteps, stepRefs]);

  return { lineHeight, containerRef };
}
