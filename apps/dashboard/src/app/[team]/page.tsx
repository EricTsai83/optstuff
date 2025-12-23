import { Header } from "@/components/dashboard/header";
import { NavigationTabs } from "@/components/dashboard/navigation-tabs";
import { SearchToolbar } from "@/components/dashboard/search-toolbar";
import { UsageSidebar } from "@/components/dashboard/usage-sidebar";
import { ProjectList } from "@/components/dashboard/project-list";
import { MobileTabs } from "@/components/dashboard/mobile-tabs";
import { Footer } from "@/components/dashboard/footer";

export default function Page() {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      <Header />
      <NavigationTabs />
      <main className="container mx-auto flex-1 px-4 py-4">
        <SearchToolbar />
        <MobileTabs />
        <div className="flex gap-8">
          <UsageSidebar />
          <ProjectList />
        </div>
      </main>
      <Footer />
    </div>
  );
}
