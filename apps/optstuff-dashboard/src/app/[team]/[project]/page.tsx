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
  const { team: teamSlug, project: projectSlug } = await params;
  const { tab } = await searchParams;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Get team by slug and verify user owns it
  const team = await db.query.teams.findFirst({
    where: eq(teams.slug, teamSlug),
  });

  if (team?.ownerId !== userId) {
    notFound();
  }

  // Get project by slug within this team
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.teamId, team.id), eq(projects.slug, projectSlug)),
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <Header teamSlug={teamSlug} />
      <ProjectDetailView project={project} team={team} defaultTab={tab} />
    </div>
  );
}
