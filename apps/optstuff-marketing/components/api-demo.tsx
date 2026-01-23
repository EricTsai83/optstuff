import { SectionHeader, SectionWrapper } from "@/components/ui/section";
import { Code2 } from "lucide-react";
import { ApiDemoSection } from "./integration-steps/api-demo";

export function ApiDemo() {
  return (
    <SectionWrapper id="api">
      <SectionHeader
        icon={Code2}
        badge="API Reference"
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
