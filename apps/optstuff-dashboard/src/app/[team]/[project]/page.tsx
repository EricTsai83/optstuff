import { redirect, notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { auth } from "@workspace/auth/server";
import { db } from "@/server/db";
import { teams, projects } from "@/server/db/schema";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ProjectDetailView } from "@/modules/project-detail";

type PageProps = {
  params: Promise<{ team: string; project: string }>;
};

export default async function ProjectPage({ params }: PageProps) {
  const { team: teamSlug, project: projectSlug } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Get team by slug and verify user owns it
  const team = await db.query.teams.findFirst({
    where: eq(teams.slug, teamSlug),
  });

  if (!team || team.ownerId !== userId) {
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
      <ProjectDetailView project={project} team={team} />
      <Footer />
    </div>
  );
}
