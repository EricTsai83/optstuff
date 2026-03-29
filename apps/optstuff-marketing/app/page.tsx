import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { HeroBackground } from "@/components/hero-background";
import { HeroIntro } from "@/components/hero-intro";
import { ImageOptimizationDemo } from "@/components/image-optimization-demo";
import dynamic from "next/dynamic";

const QuickStart = dynamic(
  () => import("@/components/quick-start").then((mod) => mod.QuickStart),
  {
    loading: () => <DeferredSectionSkeleton className="min-h-[640px]" />,
  },
);
const ApiDemo = dynamic(
  () => import("@/components/api-demo").then((mod) => mod.ApiDemo),
  {
    loading: () => <DeferredSectionSkeleton className="min-h-[420px]" />,
  },
);
const Features = dynamic(
  () => import("@/components/features").then((mod) => mod.Features),
  {
    loading: () => <DeferredSectionSkeleton className="min-h-[520px]" />,
  },
);

function DeferredSectionSkeleton({ className }: { className?: string }) {
  return (
    <section
      aria-hidden="true"
      className={`relative px-4 py-16 sm:px-6 sm:py-24 md:px-8 ${className ?? ""}`}
    >
      <div className="relative mx-auto max-w-5xl animate-pulse">
        <div className="mx-auto mb-12 h-10 w-64 rounded-full bg-white/8" />
        <div className="mx-auto h-72 rounded-3xl border border-white/8 bg-white/5" />
      </div>
    </section>
  );
}

export default async function Home() {
  return (
    <div className="bg-background min-h-screen">
      <HeroBackground />
      <Header />
      <main
        id="main-content"
        tabIndex={-1}
        className="pb-16 pt-20 sm:pb-20 sm:pt-24 md:pb-32 md:pt-40"
      >
        <HeroIntro />
        <ImageOptimizationDemo />
        <QuickStart />
        <ApiDemo />
        <Features />
      </main>
      <Footer />
    </div>
  );
}
