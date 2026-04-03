import { getVerifiedProject } from "@/lib/get-project";
import { DeveloperTab } from "@/modules/project-detail";

type PageProps = {
  params: Promise<{ team: string; project: string }>;
};

export default async function DeveloperPage({ params }: PageProps) {
  const { team: teamSlug, project: projectSlug } = await params;
  const { project } = await getVerifiedProject(teamSlug, projectSlug);

  return <DeveloperTab project={project} />;
}
