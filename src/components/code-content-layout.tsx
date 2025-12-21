import type { ReactNode } from "react";
import { CopyButton } from "@/components/copy-button";

type CodeContentLayoutProps = {
  readonly children: ReactNode;
  readonly copyText: string;
};

export function CodeContentLayout({
  children,
  copyText,
}: CodeContentLayoutProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#18181b]">
      <div className="absolute top-4 right-4 z-10">
        <CopyButton text={copyText} className="hover:border-none" />
      </div>
      <pre className="overflow-x-auto p-6">
        <code className="font-mono text-sm text-[#a1a1aa]">{children}</code>
      </pre>
    </div>
  );
}
