import { redirect, notFound } from "next/navigation";
import { auth } from "@workspace/auth/server";
import { db } from "@/server/db";
import { projects } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ProjectDetailView } from "@/modules/project-detail";
import { checkTeamAccessBySlug } from "@/server/lib/team-access";

type PageProps = {
  params: Promise<{ team: string; project: string }>;
};

export default async function ProjectPage({ params }: PageProps) {
  const { team: teamSlug, project: projectSlug } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Check team access via Clerk membership (Clerk is source of truth)
  const { hasAccess, team } = await checkTeamAccessBySlug(db, teamSlug, userId);

  if (!hasAccess || !team) {
    notFound();
  }

  // Get project by slug
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
