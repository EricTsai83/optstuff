import { Header } from "@/components/header";
import { getVerifiedTeam } from "@/lib/get-team";
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
  const team = await getVerifiedTeam(teamSlug);

  return (
    <>
      <Header teamSlug={team.slug} />
      <TeamNavigationTabs teamSlug={team.slug} />
      <div className="pb-24">
        <main className="container mx-auto flex-1 px-4 py-10">{children}</main>
      </div>
    </>
  );
}
