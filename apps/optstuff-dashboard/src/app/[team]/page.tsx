import { redirect } from "next/navigation";
import { auth } from "@workspace/auth/server";
import { Header } from "@/components/header";
import { NavigationTabs } from "@/components/navigation-tabs";
import { SearchToolbar } from "@/components/search-toolbar";
import { UsageSidebar } from "@/components/usage-sidebar";
import { ProjectList } from "@/components/project-list";
import { MobileTabs } from "@/components/mobile-tabs";
import { Footer } from "@/components/footer";

export default async function Page() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }
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
