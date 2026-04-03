import { getVerifiedProject } from "@/lib/get-project";
import { SettingsTab } from "@/modules/project-detail";
import { api, HydrateClient } from "@/trpc/server";

type PageProps = {
  params: Promise<{ team: string; project: string }>;
};

export default async function SettingsPage({ params }: PageProps) {
  const { team: teamSlug, project: projectSlug } = await params;
  const { team, project } = await getVerifiedProject(teamSlug, projectSlug);

  void api.project.getSettings.prefetch({ projectId: project.id });

  return (
    <HydrateClient>
      <SettingsTab project={project} team={team} />
    </HydrateClient>
  );
}
