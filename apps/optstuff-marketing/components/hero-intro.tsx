import { HeroAnimation } from "@/components/hero-animation";
import { AnimatedLink } from "@/components/ui/animated-link";
import { Button } from "@workspace/ui/components/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function HeroIntro() {
  return (
    <section
      id="hero"
      className="mx-auto max-w-6xl px-4 pb-8 text-center sm:px-6 md:pb-46"
    >
      {/* Badge */}
      <div className="bg-accent/10 text-accent animate-fade-in mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium sm:text-sm md:mb-14">
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

      {/* Main content */}
      <div className="flex flex-col items-center gap-8 md:flex-row md:items-center md:justify-between md:gap-12">
        {/* Text content */}
        <div className="flex flex-col items-center md:items-start md:justify-center">
          <h1 className="animate-fade-in-up animation-delay-100 mb-4 text-center text-3xl leading-[1.15] font-bold tracking-tight sm:text-4xl md:mb-6 md:text-left md:text-5xl md:leading-[1.1] lg:text-6xl lg:text-nowrap xl:text-7xl">
            Image optimization <br className="hidden sm:block" />
            <span className="text-muted-foreground">that just works</span>
          </h1>
          <p className="text-muted-foreground animate-fade-in-up animation-delay-200 max-w-md text-center text-base leading-relaxed sm:max-w-xl sm:text-lg md:text-left md:text-xl">
            Transform, resize, and optimize images on-the-fly. One API for all
            your image processing needs.
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-in-up animation-delay-300 mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4 md:mt-10 md:gap-6">
            <Button
              size="lg"
              className="group h-12 w-full rounded-full px-6 hover:shadow-xl sm:w-auto"
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
              className="h-12 w-full rounded-full px-6 hover:shadow-xl sm:w-auto"
              asChild
            >
              <Link href={process.env.NEXT_PUBLIC_DOCS_URL ?? "#"}>Documentation</Link>
            </Button>
          </div>
        </div>

        {/* Hero Animation */}
        <div className="mt-4 h-full w-full max-w-[320px] sm:max-w-[400px] md:mt-0 md:max-w-[480px]">
          <HeroAnimation />
        </div>
      </div>
    </section>
  );
}
