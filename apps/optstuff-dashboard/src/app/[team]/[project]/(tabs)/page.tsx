import { getVerifiedProject } from "@/lib/get-project";
import { OverviewTab } from "@/modules/project-detail";
import { api, HydrateClient } from "@/trpc/server";

type PageProps = {
  params: Promise<{ team: string; project: string }>;
};

export default async function ProjectOverviewPage({ params }: PageProps) {
  const { team: teamSlug, project: projectSlug } = await params;
  const { team, project } = await getVerifiedProject(teamSlug, projectSlug);

  void api.apiKey.list.prefetch({ projectId: project.id });
  void api.usage.getSummary.prefetch({ projectId: project.id });
  void api.project.getSettings.prefetch({ projectId: project.id });

  return (
    <HydrateClient>
      <OverviewTab project={project} teamSlug={team.slug} />
    </HydrateClient>
  );
}
