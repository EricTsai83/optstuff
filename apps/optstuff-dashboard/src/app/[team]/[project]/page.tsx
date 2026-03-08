import { Header } from "@/components/header";
import { ProjectDetailView } from "@/modules/project-detail";
import { db } from "@/server/db";
import { projects, teams } from "@/server/db/schema";
import { auth } from "@workspace/auth/server";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ team: string; project: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function ProjectPage({ params, searchParams }: PageProps) {
  const [{ team: teamSlug, project: projectSlug }, { tab }, { userId }] =
    await Promise.all([params, searchParams, auth()]);

  if (!userId) {
    redirect("/sign-in");
  }

  const team = await db.query.teams.findFirst({
    where: eq(teams.slug, teamSlug),
  });

  if (team?.ownerId !== userId) {
    notFound();
  }

  const project = await db.query.projects.findFirst({
    where: and(eq(projects.teamId, team.id), eq(projects.slug, projectSlug)),
  });

  if (!project) {
    notFound();
  }

  return (
    <>
      <Header teamSlug={teamSlug} />
      <ProjectDetailView project={project} team={team} defaultTab={tab} />
    </>
  );
}
