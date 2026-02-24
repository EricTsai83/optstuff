"use client";

import { NavigationTabs } from "@/components/navigation-tabs";
import { api } from "@/trpc/react";
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
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            {project.name}
          </h1>
          {project.description && (
            <p className="text-muted-foreground mt-1.5 max-w-2xl text-sm leading-relaxed">
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
