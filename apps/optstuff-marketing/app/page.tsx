import { ApiDemo } from "@/components/api-demo";
import { Features } from "@/components/features";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { HeroBackground } from "@/components/hero-background";
import { HeroIntro } from "@/components/hero-intro";
import { ImageOptimizationDemo } from "@/components/image-optimization-demo";
import { QuickStart } from "@/components/quick-start";

export default async function Home() {
  return (
    <div className="bg-background min-h-screen">
      <HeroBackground />
      <Header />
      <main className="pb-16 pt-20 sm:pb-20 sm:pt-24 md:pb-32 md:pt-40">
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
