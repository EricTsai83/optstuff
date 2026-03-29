import { SectionHeader, SectionWrapper } from "@/components/ui/section";
import { ApiDemoSection } from "./quick-start/api-demo";

export function ApiDemo() {
  return (
    <SectionWrapper id="api">
      <SectionHeader
        title="Simple API, Powerful Results"
        description="Transform your images with a single API call."
      />

      {/* API Demo Section */}
      <div className="animate-fade-in-up animation-delay-300">
        <ApiDemoSection />
      </div>
    </SectionWrapper>
  );
}
