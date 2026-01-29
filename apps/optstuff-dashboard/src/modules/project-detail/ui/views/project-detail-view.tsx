"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  Activity,
  ArrowLeft,
  Code,
  Key,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import Link from "next/link";
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

const VALID_TABS = ["overview", "api-keys", "usage", "developer", "settings"];

export function ProjectDetailView({
  project,
  team,
  defaultTab,
}: ProjectDetailViewProps) {
  const initialTab =
    defaultTab && VALID_TABS.includes(defaultTab) ? defaultTab : "overview";

  return (
    <Tabs defaultValue={initialTab} className="flex flex-1 flex-col">
      {/* Project Header */}
      <div className="border-border border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/${team.slug}`}>
              <Button variant="ghost" className="w-12">
                <ArrowLeft className="size-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold">{project.name}</h1>
                <Badge variant="secondary">{team.name}</Badge>
              </div>
              {project.description && (
                <p className="text-muted-foreground mt-1 text-sm">
                  {project.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="container mx-auto px-4">
          <TabsList className="h-auto w-full justify-start gap-0 rounded-none border-none bg-transparent p-0">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:border-foreground text-muted-foreground data-[state=active]:text-foreground rounded-none border-b-2 border-transparent px-4 py-3 shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="api-keys"
              className="data-[state=active]:border-foreground text-muted-foreground data-[state=active]:text-foreground rounded-none border-b-2 border-transparent px-4 py-3 shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <Key className="h-4 w-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger
              value="usage"
              className="data-[state=active]:border-foreground text-muted-foreground data-[state=active]:text-foreground rounded-none border-b-2 border-transparent px-4 py-3 shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <Activity className="h-4 w-4" />
              Usage
            </TabsTrigger>
            <TabsTrigger
              value="developer"
              className="data-[state=active]:border-foreground text-muted-foreground data-[state=active]:text-foreground rounded-none border-b-2 border-transparent px-4 py-3 shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <Code className="h-4 w-4" />
              Developer
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:border-foreground text-muted-foreground data-[state=active]:text-foreground rounded-none border-b-2 border-transparent px-4 py-3 shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>
        </div>
      </div>

      {/* Tab Content */}
      <main className="container mx-auto flex-1 px-4 py-6">
        <TabsContent value="overview" className="mt-0">
          <OverviewTab project={project} />
        </TabsContent>
        <TabsContent value="api-keys" className="mt-0">
          <ApiKeyList projectId={project.id} projectSlug={project.slug} />
        </TabsContent>
        <TabsContent value="usage" className="mt-0">
          <UsageTab projectId={project.id} />
        </TabsContent>
        <TabsContent value="developer" className="mt-0">
          <DeveloperTab project={project} />
        </TabsContent>
        <TabsContent value="settings" className="mt-0">
          <SettingsTab project={project} team={team} />
        </TabsContent>
      </main>
    </Tabs>
  );
}
