import { Header } from "@/components/header";
import { TeamNavigationTabs } from "@/modules/team/ui/components/team-navigation-tabs";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ team: string }>;
};

export default async function TeamTabsLayout({
  children,
  params,
}: LayoutProps) {
  const { team: teamSlug } = await params;

  return (
    <>
      <Header teamSlug={teamSlug} />
      <TeamNavigationTabs teamSlug={teamSlug} />
      <div className="pb-24">
        <main className="container mx-auto flex-1 px-4 py-10">{children}</main>
      </div>
    </>
  );
}
