import { Header } from "@/components/header";
import { DOCS_LINKS } from "@/lib/constants";
import { getVerifiedProject } from "@/lib/get-project";
import { ProjectNavigationTabs } from "@/modules/project-detail/ui/components/project-navigation-tabs";
import { Button } from "@workspace/ui/components/button";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  ExternalLink,
  KeyRound,
} from "lucide-react";
import Link from "next/link";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ team: string; project: string }>;
};

export default async function ProjectTabsLayout({
  children,
  params,
}: LayoutProps) {
  const { team: teamSlug, project: projectSlug } = await params;
  const { team, project } = await getVerifiedProject(teamSlug, projectSlug);

  return (
    <>
      <Header teamSlug={team.slug} />
      <ProjectNavigationTabs teamSlug={team.slug} projectSlug={project.slug} />
      <main className="container mx-auto flex-1 px-4 py-6">
        <div className="mb-8">
          <Link
            href={`/${team.slug}`}
            className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home page
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {project.name}
            </h1>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/${team.slug}/${project.slug}/~/api-keys`}>
                  <KeyRound className="h-3.5 w-3.5" />
                  Manage Keys
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/${team.slug}/${project.slug}/~/usage`}>
                  <BarChart3 className="h-3.5 w-3.5" />
                  View Stats
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a
                  href={DOCS_LINKS.integration}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Docs
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>

          {project.description && (
            <p className="mt-2 max-w-3xl text-base leading-relaxed sm:text-lg">
              {project.description}
            </p>
          )}
        </div>

        {children}
      </main>
    </>
  );
}
