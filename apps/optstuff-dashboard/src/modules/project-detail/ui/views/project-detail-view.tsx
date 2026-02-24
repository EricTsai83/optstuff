"use client";

import { NavigationTabs } from "@/components/navigation-tabs";
import { DOCS_LINKS } from "@/lib/constants";
import { api } from "@/trpc/react";
import { Button } from "@workspace/ui/components/button";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  ExternalLink,
  KeyRound,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PROJECT_TABS, type ProjectTab } from "../../constants";
import type { Project, Team } from "../../types";
import { ApiKeyList } from "../components/api-key-list";
import { DeveloperTab } from "./developer-tab";
import { OverviewTab } from "./overview-tab";
import { SettingsTab } from "./settings-tab";
import { UsageTab } from "./usage-tab";

type ProjectDetailViewProps = {
  readonly project: Project;
  readonly team: Team;
  readonly defaultTab?: string;
};

export function ProjectDetailView({
  project: initialProject,
  team,
  defaultTab,
}: ProjectDetailViewProps) {
  const initialTab = (
    defaultTab && PROJECT_TABS.some((t) => t.value === defaultTab)
      ? defaultTab
      : "overview"
  ) as ProjectTab;

  const [activeTab, setActiveTab] = useState<ProjectTab>(initialTab);

  const { data: liveProject } = api.project.getBySlug.useQuery({
    teamSlug: team.slug,
    projectSlug: initialProject.slug,
  });

  const project = liveProject ?? initialProject;

  return (
    <>
      <NavigationTabs
        tabs={PROJECT_TABS}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as ProjectTab)}
      />

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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("api-keys")}
              >
                <KeyRound className="h-3.5 w-3.5" />
                Manage Keys
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("usage")}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                View Stats
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

        {activeTab === "overview" && <OverviewTab project={project} />}
        {activeTab === "api-keys" && (
          <ApiKeyList projectId={project.id} projectSlug={project.slug} />
        )}
        {activeTab === "usage" && <UsageTab projectId={project.id} />}
        {activeTab === "developer" && <DeveloperTab project={project} />}
        {activeTab === "settings" && (
          <SettingsTab project={project} team={team} />
        )}
      </main>
    </>
  );
}
