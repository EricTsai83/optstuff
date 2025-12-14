import { Header } from "@/components/header";
import { HeroIntro } from "@/components/hero-intro";
import { ImageOptimizationDemo } from "@/components/image-optimization-demo";
import { ValueProps } from "@/components/value-props";
import { IntegrationSteps } from "@/components/integration-steps";
import { Features } from "@/components/features";
import { CodeExample } from "@/components/code-example";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main>
        <section id="demo" className="pt-16 pb-24 md:pt-24 md:pb-32">
          <div className="container mx-auto px-4 md:px-6">
            <HeroIntro />
            <ImageOptimizationDemo />
          </div>
        </section>
        <ValueProps />
        <IntegrationSteps />
        <Features />
        <CodeExample />
      </main>
      <Footer />
    </div>
  );
}
