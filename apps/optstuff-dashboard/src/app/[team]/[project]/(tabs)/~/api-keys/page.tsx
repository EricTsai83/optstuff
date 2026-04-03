import { getVerifiedProject } from "@/lib/get-project";
import { ApiKeyList } from "@/modules/project-detail";
import { api, HydrateClient } from "@/trpc/server";

type PageProps = {
  params: Promise<{ team: string; project: string }>;
};

export default async function ApiKeysPage({ params }: PageProps) {
  const { team: teamSlug, project: projectSlug } = await params;
  const { project } = await getVerifiedProject(teamSlug, projectSlug);

  void api.apiKey.list.prefetch({ projectId: project.id });

  return (
    <HydrateClient>
      <ApiKeyList projectId={project.id} projectSlug={project.slug} />
    </HydrateClient>
  );
}
