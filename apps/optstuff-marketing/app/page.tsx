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
      <main className="pt-20 pb-16 sm:pt-24 sm:pb-20 md:pt-40 md:pb-32">
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
