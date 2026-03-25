import { cn } from "@workspace/ui/lib/utils";
import { buttonVariants } from "fumadocs-ui/components/ui/button";

export function GetStartedButton() {
  return (
    <a
      href="https://optstuff.vercel.app"
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        buttonVariants({ color: "primary", variant: "primary" }),
        "mt-4 gap-2 px-5 py-2.5 no-underline",
      )}
    >
      Get Started <span aria-hidden="true">→</span>
    </a>
  );
}
