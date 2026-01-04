import { ArrowRight } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { AnimatedLink } from "@/components/ui/animated-link";
import Link from "next/link";
import { HeroAnimation } from "@/components/hero-animation";

export function HeroIntro() {
  return (
    <section
      id="hero"
      className="mx-auto max-w-6xl px-6 pb-10 text-center md:pb-46"
    >
      <div className="bg-accent/10 text-accent animate-fade-in-up mb-8 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium md:mb-14">
        <span className="relative flex h-2 w-2">
          <span className="bg-accent absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
          <span className="bg-accent relative inline-flex h-2 w-2 rounded-full"></span>
        </span>
        Powered by
        <AnimatedLink
          href="https://github.com/unjs/ipx"
          external
          showExternalIcon
        >
          🖼️ IPX
        </AnimatedLink>
      </div>
      <div className="flex flex-col items-center gap-12 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col items-center text-left md:items-start md:justify-center">
          <h1 className="animate-fade-in-up animation-delay-100 mb-6 text-center text-4xl leading-[1.1] font-bold tracking-tight text-balance md:text-left md:text-5xl lg:text-6xl lg:text-nowrap xl:text-7xl">
            Image optimization <br />
            <span className="text-muted-foreground">that just works</span>
          </h1>
          <p className="text-muted-foreground animate-fade-in-up animation-delay-200 max-w-xl text-center text-lg leading-relaxed text-pretty md:text-left md:text-xl">
            Transform, resize, and optimize images on-the-fly. One API for all
            your image processing needs.
          </p>
          <div className="animate-fade-in-up animation-delay-300 mt-10 space-x-6">
            <Button
              size="lg"
              className="group h-12 rounded-full px-6 hover:shadow-xl"
              asChild
            >
              <Link href="/">
                Start for free
                <ArrowRight className="ml-0.5 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 rounded-full px-6 hover:shadow-xl"
              asChild
            >
              <Link href="/docs">Documentation</Link>
            </Button>
          </div>
        </div>
        <div className="h-full w-full max-w-[480px]">
          <HeroAnimation />
        </div>
      </div>
    </section>
  );
}
