"use client";

import { useEffect, useState } from "react";
import type { TypewriterCodeProps } from "../types";
import { SyntaxHighlight } from "./syntax-highlight";

export function TypewriterCode({
  code,
  isTyping,
  isResponse,
}: TypewriterCodeProps) {
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
        isResponse ? 5 : 15,
      );
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, code, isResponse]);

  return (
    <div className="bg-[#0d0d0f] p-3 sm:p-4">
      <pre className="scrollbar-hide overflow-x-auto">
        <code className="font-mono text-[10px] leading-relaxed sm:text-sm">
          <SyntaxHighlight code={displayedCode} isResponse={isResponse} />
          <span className="text-accent animate-pulse">▊</span>
        </code>
      </pre>
    </div>
  );
}
