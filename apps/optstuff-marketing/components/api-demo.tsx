import { SectionHeader, SectionWrapper } from "@/components/ui/section";
import { ApiDemoSection } from "./quick-start/api-demo";

export function ApiDemo() {
  return (
    <SectionWrapper id="api" maxWidth="5xl">
      <SectionHeader
        title="Sign once. Deliver everywhere."
        description="The request stays readable: define the transform, sign it on your server, and let OptStuff return a cacheable optimized image."
      />

      {/* API Demo Section */}
      <div className="animate-fade-in-up animation-delay-300">
        <ApiDemoSection />
      </div>
    </SectionWrapper>
  );
}
