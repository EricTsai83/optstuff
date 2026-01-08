"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Users, FolderPlus, Key, Zap, ChevronRight, LogIn } from "lucide-react";
import { CodeBlock } from "@workspace/ui/components/code-block";
import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import { SignInButton, SignedIn, SignedOut } from "@workspace/auth/client";

type Step = {
  readonly number: string;
  readonly title: string;
  readonly description: string;
};

const STEPS: readonly Step[] = [
  {
    number: "1",
    title: "Create your Team",
    description: "Sign up and create a team in your dashboard to get started.",
  },
  {
    number: "2",
    title: "Set up a Project",
    description: "Create a project within your team and generate an API key.",
  },
  {
    number: "3",
    title: "Start Optimizing",
    description: "Use your API key to optimize images on the fly.",
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
            Create a team, set up a project, and start optimizing images with a
            simple API call.
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

        {index === 0 && <CreateTeamVisual />}
        {index === 1 && <SetupProjectVisual />}
        {index === 2 && <ApiCallVisual />}
      </div>
    </>
  );
}

/** Step 1: 視覺化的 Dashboard 導航流程 */
function CreateTeamVisual() {
  return (
    <div className="border-border/50 bg-background/50 flex flex-wrap items-center gap-2 rounded-xl border p-4 backdrop-blur-sm">
      <BreadcrumbItem icon={<Users className="h-4 w-4" />} label="Dashboard" />
      <ChevronRight className="text-muted-foreground h-4 w-4" />
      <BreadcrumbItem label="New Team" isActive />
      <ChevronRight className="text-muted-foreground h-4 w-4" />
      <span className="bg-accent/20 text-accent rounded-md px-3 py-1.5 text-sm font-medium">
        &ldquo;My Awesome Team&rdquo;
      </span>
    </div>
  );
}

type BreadcrumbItemProps = {
  readonly icon?: React.ReactNode;
  readonly label: string;
  readonly isActive?: boolean;
};

function BreadcrumbItem({ icon, label, isActive }: BreadcrumbItemProps) {
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm",
        isActive
          ? "bg-foreground/10 text-foreground font-medium"
          : "text-muted-foreground",
      )}
    >
      {icon}
      {label}
    </span>
  );
}

/** Step 2: 展示 Project + API Key 卡片 */
function SetupProjectVisual() {
  const [currentUrl, setCurrentUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);
  console.log("currentUrl", currentUrl);

  return (
    <div className="border-border/50 bg-background/50 space-y-3 rounded-xl border p-4 backdrop-blur-sm">
      {/* Project 卡片 */}
      <div className="bg-muted/30 flex items-center gap-3 rounded-lg p-3">
        <div className="bg-accent/20 flex h-10 w-10 items-center justify-center rounded-lg">
          <FolderPlus className="text-accent h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-foreground text-sm font-medium">my-website</p>
          <p className="text-muted-foreground text-xs">Production</p>
        </div>
        <span className="bg-green-500/20 rounded-full px-2 py-0.5 text-xs text-green-400">
          Active
        </span>
      </div>

      {/* API Key 卡片 - 根據登入狀態顯示不同內容 */}
      <div className="bg-muted/30 rounded-lg p-3">
        <div className="mb-2 flex items-center gap-2">
          <Key className="text-accent h-4 w-4" />
          <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
            API Key
          </span>
        </div>

        <SignedIn>
          <ApiKeyDisplay />
        </SignedIn>

        <SignedOut>
          <div className="flex items-center gap-3">
            <code className="text-muted-foreground flex-1 truncate font-mono text-sm">
              Sign in to view your API key
            </code>
            <SignInButton mode="modal">
              <Button
                size="sm"
                className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0 cursor-pointer gap-1.5"
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign in
              </Button>
            </SignInButton>
          </div>
        </SignedOut>
      </div>
    </div>
  );
}

const API_KEY_PREFIX = "sk_live_";
const API_KEY = `${API_KEY_PREFIX}a1b2c3d4e5f6g7h8i9j0`;

/** API Key 顯示區塊（登入後可見） */
function ApiKeyDisplay() {
  return (
    <CodeBlock
      content={API_KEY}
      revealable
      maskPrefix={API_KEY_PREFIX}
      className="border-0"
    />
  );
}

const API_REQUEST_CODE = `https://api.optstuff.dev/v1/optimize
  ?url=https://example.com/hero.png
  &width=800
  &format=webp`;

const HEADERS_CODE = `Authorization: Bearer sk_live_xxx...`;

/** Step 3: API 呼叫範例 */
function ApiCallVisual() {
  return (
    <div className="border-border/50 overflow-hidden rounded-xl border">
      {/* Header */}
      <div className="bg-muted/50 border-border/50 flex items-center gap-2 border-b px-4 py-2">
        <Zap className="text-accent h-4 w-4" />
        <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
          API Request
        </span>
        <span className="bg-green-500/20 ml-auto rounded-full px-2 py-0.5 text-xs text-green-400">
          GET
        </span>
      </div>

      {/* Content */}
      <div className="space-y-4 p-4">
        <CodeBlock
          content={API_REQUEST_CODE}
          variant="block"
          className="border-0"
        />

        <div className="border-border/50 border-t pt-4">
          <p className="text-muted-foreground mb-2 text-xs">Headers</p>
          <CodeBlock
            content={HEADERS_CODE}
            variant="inline"
            className="border-0"
          />
        </div>
      </div>
    </div>
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
