"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Check, Copy, Terminal, ArrowRight, Eye, EyeOff } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

type Step = {
  readonly number: string;
  readonly title: string;
  readonly description: string;
};

const STEPS: readonly Step[] = [
  {
    number: "1",
    title: "Create a Project",
    description: "Sign up and create a project in your dashboard.",
  },
  {
    number: "2",
    title: "Get API Key",
    description: "Your project includes a default API key ready to use.",
  },
  {
    number: "3",
    title: "Start Optimizing",
    description: "Use the API to optimize images instantly.",
  },
] as const;

export function IntegrationSteps() {
  const { visibleSteps, setStepRef } = useStepVisibility(STEPS.length);

  return (
    <section className="relative overflow-hidden px-6 py-24 md:px-8">
      {/* 背景裝飾 */}
      <div className="pointer-events-none absolute inset-0">
        <div className="bg-accent/5 absolute left-1/4 top-1/4 h-96 w-96 rounded-full blur-3xl" />
        <div className="bg-accent/3 absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-20 text-center">
          <div className="animate-fade-in border-accent/30 bg-accent/10 text-accent mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium">
            <Terminal className="h-4 w-4" />
            Quick Start
          </div>
          <h2 className="text-foreground animate-fade-in-up animation-delay-100 mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Three steps to faster images
          </h2>
          <p className="text-muted-foreground animate-fade-in-up animation-delay-200 mx-auto max-w-2xl text-lg">
            Get started in minutes with a simple integration.
          </p>
        </div>

        {/* 垂直時間線 */}
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
                  !isLast && "pb-16",
                )}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                {/* 連接線 */}
                {!isLast && (
                  <div
                    className={cn(
                      "absolute left-5 top-12 h-[calc(100%-3rem)] w-0.5 transition-all duration-1000 md:left-6",
                      isVisible ? "bg-accent/30" : "bg-border/30",
                    )}
                    style={{ transitionDelay: `${index * 200 + 300}ms` }}
                  />
                )}

                {/* 步驟內容 */}
                <div className="flex gap-6 md:gap-8">
                  {/* 左側：步驟編號 */}
                  <div className="relative z-10 shrink-0">
                    <div
                      className={cn(
                        "bg-accent text-accent-foreground flex h-10 w-10 items-center justify-center rounded-xl text-base font-bold shadow-lg transition-all duration-500 md:h-12 md:w-12 md:text-lg",
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

                  {/* 右側：標題 + Demo */}
                  <div className="flex-1">
                    {/* 標題區域 */}
                    <div className="mb-4">
                      <h3 className="text-foreground text-xl font-bold md:text-2xl">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {step.description}
                      </p>
                    </div>

                    {/* Demo 區域 - 固定高度卡片 */}
                    <div
                      className={cn(
                        "border-border/50 bg-card/50 h-[200px] overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-500 md:h-[220px]",
                        isVisible
                          ? "translate-x-0 opacity-100"
                          : "translate-x-8 opacity-0",
                      )}
                      style={{ transitionDelay: `${index * 200 + 200}ms` }}
                    >
                      <div className="h-full p-4 md:p-5">
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

        {/* API Demo Section */}
        <div className="mt-20">
          <ApiDemoSection />
        </div>
      </div>
    </section>
  );
}

/** Step 1: Dashboard 模擬界面 - 參考 Vercel Dashboard */
function CreateProjectVisual() {
  const [step, setStep] = useState(0);
  const [typedName, setTypedName] = useState("");
  const projectName = "my-app";

  useEffect(() => {
    // step 0: 初始狀態，顯示 Add New 按鈕高亮
    // step 1: 點擊 Add New，顯示下拉選單
    // step 2: 顯示 Create a new app 表單，打字輸入名稱
    // step 3: Submit 按鈕高亮，準備提交
    // step 4: 顯示成功畫面
    const delays = [1500, 1200, 2000, 1200, 2500];
    const timeout = setTimeout(() => {
      setStep((prev) => {
        if (prev >= 4) {
          setTypedName("");
          return 0;
        }
        return prev + 1;
      });
    }, delays[step]);
    return () => clearTimeout(timeout);
  }, [step]);

  // 打字效果
  useEffect(() => {
    if (step === 2 && typedName.length < projectName.length) {
      const timeout = setTimeout(() => {
        setTypedName(projectName.slice(0, typedName.length + 1));
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [step, typedName]);

  // 判斷是否在表單步驟（包括打字和準備提交）
  const isFormStep = step === 2 || step === 3;
  // 判斷是否準備提交（Submit 按鈕高亮）
  const isReadyToSubmit = step === 3;
  // 判斷是否成功
  const isSuccess = step === 4;

  return (
    <div className="bg-card flex h-full flex-col overflow-hidden rounded-xl border border-border/50">
      {/* Mac window header */}
      <div className="bg-muted/50 flex items-center justify-between border-b border-border/50 px-4 py-2">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <span className="text-muted-foreground ml-2 text-xs">Dashboard</span>
        </div>

        {/* Add New button */}
        <div className="relative">
          <button
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              step === 0
                ? "border border-accent bg-transparent text-accent ring-2 ring-accent/30"
                : "border border-accent bg-accent text-accent-foreground",
            )}
          >
            Add New...
            <span className="text-[10px]">▼</span>
          </button>

          {/* Dropdown menu */}
          {step === 1 && (
            <div className="bg-popover absolute right-0 top-full z-10 mt-1.5 w-36 overflow-hidden rounded-lg border border-border/50 py-1.5 shadow-xl">
              <div className="cursor-pointer bg-accent/20 px-4 py-2 text-xs font-medium text-accent">
                New Project
              </div>
              <div className="text-muted-foreground px-4 py-2 text-xs">
                Import from GitHub
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col p-4">
        {(step === 0 || step === 1) && (
          <div className="flex h-full flex-col items-center justify-center">
            <div className="text-muted-foreground/50 text-sm">
              {step === 0 ? 'Click "Add New..."' : 'Select "New Project"'}
            </div>
          </div>
        )}

        {isFormStep && (
          <div className="flex h-full flex-col justify-center space-y-3">
            <div className="text-foreground text-sm font-semibold">
              Create a new app
            </div>
            <div className="flex items-end gap-2">
              {/* Team select */}
              <div className="flex-1">
                <div className="text-muted-foreground mb-1.5 text-xs">Team</div>
                <div className="bg-muted/30 flex h-9 items-center justify-between rounded-lg border border-border/50 px-3">
                  <span className="text-foreground/70 text-xs">Personal</span>
                  <span className="text-muted-foreground text-xs">▼</span>
                </div>
              </div>
              {/* Separator */}
              <div className="text-muted-foreground pb-2.5 text-sm">/</div>
              {/* App name input */}
              <div className="flex-1">
                <div className="text-muted-foreground mb-1.5 text-xs">Name</div>
                <div
                  className={cn(
                    "bg-muted/30 flex h-9 items-center rounded-lg border px-3 transition-all",
                    isReadyToSubmit
                      ? "border-border/50"
                      : "border-accent/50 ring-2 ring-accent/20",
                  )}
                >
                  <span className="text-foreground text-xs">
                    {typedName}
                    {!isReadyToSubmit && (
                      <span className="animate-pulse text-accent">|</span>
                    )}
                  </span>
                </div>
              </div>
              {/* Submit button */}
              <button
                className={cn(
                  "h-9 rounded-lg px-4 text-xs font-medium transition-all",
                  isReadyToSubmit
                    ? "bg-accent text-accent-foreground ring-2 ring-accent/50"
                    : "bg-muted text-muted-foreground",
                )}
              >
                Create
              </button>
            </div>
          </div>
        )}

        {isSuccess && (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
              <Check className="h-6 w-6 text-emerald-600 dark:text-green-400" />
            </div>
            <div className="text-sm font-medium text-emerald-600 dark:text-green-400">
              Project Created!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Step 2: API Key 列表 - 參考 Standard Keys 設計 */
function SetupProjectVisual() {
  // 0: 初始遮罩狀態, 1: 眼睛按鈕高亮, 2: key 已揭示
  const [step, setStep] = useState(0);
  const apiKey = "sk_live_a1b2c3ihgk9f76g9g0";
  const maskedKey = "sk_live_******************";

  useEffect(() => {
    const delays = [1500, 1200, 3000];
    const timeout = setTimeout(() => {
      setStep((prev) => (prev >= 2 ? 0 : prev + 1));
    }, delays[step]);
    return () => clearTimeout(timeout);
  }, [step]);

  const isEyeHighlighted = step === 1;
  const isRevealed = step === 2;

  return (
    <div className="bg-card flex h-full flex-col overflow-hidden rounded-xl border border-border/50">
      {/* Mac window header */}
      <div className="bg-muted/50 flex items-center gap-1.5 border-b border-border/50 px-4 py-2">
        <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="text-muted-foreground ml-2 text-xs">API Keys</span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-center p-4">
        {/* Section title */}
        <div className="mb-3">
          <div className="text-foreground text-sm font-semibold">
            Standard Keys
          </div>
        </div>

        {/* Key row */}
        <div className="bg-muted/30 flex items-center gap-3 rounded-lg border border-border/50 px-4 py-3">
          {/* Name */}
          <div className="text-foreground/70 shrink-0 text-xs">Secret Key</div>

          {/* Key with eye button */}
          <div className="flex flex-1 items-center gap-2.5">
            <code
              className={cn(
                "flex-1 rounded-lg border px-3 py-1.5 font-mono text-xs transition-all duration-300",
                isRevealed
                  ? "border-accent/30 bg-accent/10 text-accent"
                  : "border-border/50 bg-muted/50 text-muted-foreground",
              )}
            >
              {isRevealed ? apiKey : maskedKey}
            </code>
            <button
              className={cn(
                "shrink-0 rounded-lg p-1.5 transition-all duration-300",
                isEyeHighlighted
                  ? "bg-accent/20 text-accent ring-2 ring-accent/40"
                  : isRevealed
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:text-foreground",
              )}
              aria-label={isRevealed ? "Hide API key" : "Show API key"}
            >
              {isRevealed ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Step 3: Realtime 優化流程視覺化 - 清楚展示 OptStuff 服務器最佳化後回傳 */
function OptimizeVisual() {
  // 0: idle, 1: website sends request, 2: optstuff processing, 3: response returning, 4: website received
  const [step, setStep] = useState(0);

  useEffect(() => {
    const delays = [1200, 1000, 1500, 1000, 2500];
    const timeout = setTimeout(() => {
      setStep((prev) => (prev >= 4 ? 0 : prev + 1));
    }, delays[step]);
    return () => clearTimeout(timeout);
  }, [step]);

  // 判斷各區塊是否高亮
  const isWebsiteActive = step === 1 || step === 4;
  const isOptStuffActive = step === 2;
  const isRequestArrowActive = step === 1;
  const isResponseArrowActive = step === 3;
  const isWebsiteShowingResult = step === 4;

  return (
    <div className="flex h-full items-stretch gap-3">
      {/* 左側：Website（有 Mac 窗口佈局） */}
      <div className="flex flex-[1.5] flex-col overflow-hidden rounded-xl border border-border/50 bg-card">
        {/* Mac window header */}
        <div className="flex items-center gap-1.5 border-b border-border/50 bg-muted/50 px-4 py-2">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <span className="text-muted-foreground ml-2 text-xs">
            yoursite.com
          </span>
        </div>

        {/* 代碼視圖：展示 img src URL */}
        <div className="flex-1 p-3">
          <div
            className={cn(
              "flex h-full flex-col justify-center overflow-hidden rounded-lg border px-4 py-3 font-mono transition-all duration-300",
              isWebsiteActive
                ? "border-accent/40 bg-accent/5"
                : isWebsiteShowingResult
                  ? "border-green-500/40 bg-green-500/5"
                  : "border-border/50 bg-muted/30",
            )}
          >
            {/* 初始/請求狀態：顯示 URL */}
            <div
              className={cn(
                "transition-all duration-500",
                isWebsiteShowingResult ? "hidden" : "block",
              )}
            >
              <div className="flex flex-wrap items-center text-xs leading-relaxed">
                <span className="text-purple-500 dark:text-purple-400">
                  &lt;img
                </span>
                <span className="text-muted-foreground">{" src="}</span>
                <span
                  className={cn(
                    "transition-colors duration-300",
                    isWebsiteActive
                      ? "text-accent"
                      : "text-emerald-600 dark:text-green-400",
                  )}
                >
                  &quot;optstuff.dev/?url=
                </span>
                <span className="text-amber-600 dark:text-amber-400">
                  hero.png
                </span>
                <span
                  className={cn(
                    "transition-colors duration-300",
                    isWebsiteActive
                      ? "text-accent"
                      : "text-emerald-600 dark:text-green-400",
                  )}
                >
                  &quot;
                </span>
                <span className="text-purple-500 dark:text-purple-400">
                  /&gt;
                </span>
              </div>
            </div>

            {/* 優化完成：顯示結果 */}
            <div
              className={cn(
                "transition-all duration-500",
                isWebsiteShowingResult ? "block" : "hidden",
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-12 items-center justify-center rounded-lg bg-green-500/20">
                  <span className="text-lg">🖼️</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-emerald-600 dark:text-green-400">
                    hero.webp
                  </div>
                  <div className="text-muted-foreground text-xs">
                    92% smaller
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 中間：雙向箭頭區域 */}
      <div className="relative flex flex-col items-center justify-center gap-3 px-3">
        {/* Request 箭頭（向右）*/}
        <div className="relative flex items-center">
          <div
            className={cn(
              "h-0.5 w-6 transition-all duration-300",
              isRequestArrowActive ? "bg-accent" : "bg-muted-foreground/30",
            )}
          />
          <ArrowRight
            className={cn(
              "-ml-1 h-5 w-5 transition-all duration-300",
              isRequestArrowActive ? "text-accent" : "text-muted-foreground/30",
            )}
          />
          {isRequestArrowActive && (
            <div className="animate-flow-dot-right absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_8px_3px_hsl(var(--accent)/0.5)]" />
          )}
        </div>

        {/* Response 箭頭（向左）*/}
        <div className="relative flex items-center">
          <ArrowRight
            className={cn(
              "-mr-1 h-5 w-5 rotate-180 transition-all duration-300",
              isResponseArrowActive
                ? "text-emerald-600 dark:text-green-400"
                : "text-muted-foreground/30",
            )}
          />
          <div
            className={cn(
              "h-0.5 w-6 transition-all duration-300",
              isResponseArrowActive
                ? "bg-emerald-500"
                : "bg-muted-foreground/30",
            )}
          />
          {isResponseArrowActive && (
            <div className="animate-flow-dot-left absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-emerald-500 shadow-[0_0_8px_3px_rgba(16,185,129,0.5)]" />
          )}
        </div>
      </div>

      {/* 右側：OptStuff Server */}
      <div
        className={cn(
          "bg-card relative flex flex-1 flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border p-4 transition-all duration-300",
          isOptStuffActive
            ? "border-accent/50"
            : step >= 3
              ? "border-green-500/40"
              : "border-border/50",
        )}
      >
        {/* Logo / 圖示區域 */}
        <div className="relative flex flex-col items-center gap-2">
          <div
            className={cn(
              "relative flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300",
              isOptStuffActive
                ? "bg-accent/20"
                : step >= 3
                  ? "bg-green-500/20"
                  : "bg-muted/50",
            )}
          >
            {/* Ping 效果 */}
            {isOptStuffActive && (
              <div className="animate-soft-pulse absolute inset-0 rounded-2xl bg-accent/40" />
            )}

            <div className="relative">
              {isOptStuffActive ? (
                <span className="text-2xl">⚡</span>
              ) : step >= 3 ? (
                <Check className="h-7 w-7 text-emerald-600 dark:text-green-400" />
              ) : (
                <span className="text-2xl">📦</span>
              )}
            </div>
          </div>

          {/* OptStuff 標題 */}
          <div
            className={cn(
              "text-sm font-bold transition-colors duration-300",
              isOptStuffActive
                ? "text-accent"
                : step >= 3
                  ? "text-emerald-600 dark:text-green-400"
                  : "text-muted-foreground",
            )}
          >
            OptStuff
          </div>
        </div>
      </div>
    </div>
  );
}

/** API Demo Section */
function ApiDemoSection() {
  const [activeTab, setActiveTab] = useState<"curl" | "js" | "response">(
    "curl",
  );
  const [copied, setCopied] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const codeExamples = {
    curl: `curl "https://api.optstuff.dev/v1/optimize?\\
  url=https://example.com/hero.png&\\
  width=800&\\
  format=webp" \\
  -H "Authorization: Bearer sk_live_xxx"`,
    js: `const response = await fetch(
  "https://api.optstuff.dev/v1/optimize?" +
  new URLSearchParams({
    url: "https://example.com/hero.png",
    width: "800",
    format: "webp"
  }),
  {
    headers: {
      Authorization: "Bearer sk_live_xxx"
    }
  }
);`,
    response: `{
  "success": true,
  "data": {
    "url": "https://cdn.optstuff.dev/optimized/abc123.webp",
    "originalSize": 2457600,
    "optimizedSize": 190464,
    "savings": "92%"
  }
}`,
  };

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(codeExamples[activeTab]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const handleTabChange = (tab: "curl" | "js" | "response"): void => {
    setActiveTab(tab);
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 50);
  };

  return (
    <div className="border-border/50 bg-card/30 overflow-hidden rounded-2xl border backdrop-blur-sm">
      {/* Header */}
      <div className="border-border/50 flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/80" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <div className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-muted-foreground ml-2 text-sm font-medium">
            API Example
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {(["curl", "js", "response"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-all duration-200",
                activeTab === tab
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              {tab === "curl"
                ? "cURL"
                : tab === "js"
                  ? "JavaScript"
                  : "Response"}
            </button>
          ))}
        </div>
      </div>

      {/* Code Block */}
      <div className="relative">
        <TypewriterCode
          code={codeExamples[activeTab]}
          isTyping={isTyping}
          isResponse={activeTab === "response"}
        />

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="absolute right-4 top-4 flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
}

type TypewriterCodeProps = {
  readonly code: string;
  readonly isTyping: boolean;
  readonly isResponse?: boolean;
};

function TypewriterCode({ code, isTyping, isResponse }: TypewriterCodeProps) {
  const [displayedCode, setDisplayedCode] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isTyping) {
      setDisplayedCode("");
      setCurrentIndex(0);
    }
  }, [isTyping, code]);

  useEffect(() => {
    if (currentIndex < code.length) {
      const timeout = setTimeout(
        () => {
          setDisplayedCode(code.slice(0, currentIndex + 1));
          setCurrentIndex((prev) => prev + 1);
        },
        // Response JSON 打字速度較快
        isResponse ? 5 : 15,
      );
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, code, isResponse]);

  return (
    <div className="bg-[#0d0d0f] p-4">
      <pre className="scrollbar-hide overflow-x-auto">
        <code className="font-mono text-sm leading-relaxed">
          <SyntaxHighlight code={displayedCode} isResponse={isResponse} />
          <span className="animate-pulse text-accent">▊</span>
        </code>
      </pre>
    </div>
  );
}

type SyntaxHighlightProps = {
  readonly code: string;
  readonly isResponse?: boolean;
};

/** 簡單的語法高亮 */
function SyntaxHighlight({ code, isResponse }: SyntaxHighlightProps) {
  if (isResponse) {
    // JSON 語法高亮
    const highlighted = code
      .replace(/"([^"]+)":/g, '<span class="text-purple-400">"$1"</span>:')
      .replace(/: "([^"]+)"/g, ': <span class="text-green-400">"$1"</span>')
      .replace(/: (\d+)/g, ': <span class="text-amber-400">$1</span>')
      .replace(/: (true|false)/g, ': <span class="text-blue-400">$1</span>');
    return (
      <span
        className="text-gray-300"
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    );
  }

  // cURL / JS 語法高亮
  const highlighted = code
    .replace(
      /(curl|const|await|fetch|new)/g,
      '<span class="text-purple-400">$1</span>',
    )
    .replace(
      /("https?:\/\/[^"]+"|'https?:\/\/[^']+')/g,
      '<span class="text-green-400">$1</span>',
    )
    .replace(
      /(-H|headers|Authorization|Bearer)/g,
      '<span class="text-amber-400">$1</span>',
    )
    .replace(/(URLSearchParams)/g, '<span class="text-blue-400">$1</span>');

  return (
    <span
      className="text-gray-300"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
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
        { threshold: 0.2 },
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
