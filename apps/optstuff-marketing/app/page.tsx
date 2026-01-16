import { Header } from "@/components/header";
import { HeroIntro } from "@/components/hero-intro";
import { ImageOptimizationDemo } from "@/components/image-optimization-demo";
import { IntegrationSteps } from "@/components/integration-steps";
import { Features } from "@/components/features";
import { CodeExample } from "@/components/code-example";
import { Footer } from "@/components/footer";
import { HeroBackground } from "@/components/hero-background";

export default async function Home() {
  return (
    <div className="bg-background min-h-screen">
      <HeroBackground />

      <Header />
      <main className="pt-20 pb-16 sm:pt-24 sm:pb-20 md:pt-40 md:pb-32">
        <HeroIntro />

        {/* Demo section */}
        <section
          id="demo"
          className="container mx-auto px-4 py-12 sm:py-16 md:px-6 md:py-24"
        >
          <ImageOptimizationDemo />
        </section>

        <IntegrationSteps />

        {/* Features section */}
        <div className="container mx-auto px-4 md:px-6">
          <Features />
        </div>

        <CodeExample />
      </main>
      <Footer />
    </div>
  );
}
