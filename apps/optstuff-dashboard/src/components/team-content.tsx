"use client";

import { useState } from "react";
import { NavigationTabs, type NavTab } from "./navigation-tabs";
import { SearchToolbar } from "./search-toolbar";
import { UsageSidebar } from "./usage-sidebar";
import { ProjectList } from "./project-list";
import { MobileTabs } from "./mobile-tabs";
import { TeamUsage } from "./team-usage";
import { TeamSettings } from "./team-settings";

type TeamContentProps = {
  readonly teamId: string;
  readonly teamSlug: string;
  readonly teamName: string;
  readonly isPersonal: boolean;
};

export function TeamContent({
  teamId,
  teamSlug,
  teamName,
  isPersonal,
}: TeamContentProps) {
  const [activeTab, setActiveTab] = useState<NavTab>("Overview");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="container mx-auto flex-1 px-4 py-4">
        {activeTab === "Overview" && (
          <>
            <SearchToolbar
              teamId={teamId}
              teamSlug={teamSlug}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
            <MobileTabs teamId={teamId} />
            <div className="flex gap-8">
              <UsageSidebar teamId={teamId} />
              <ProjectList
                teamId={teamId}
                teamSlug={teamSlug}
                searchQuery={searchQuery}
              />
            </div>
          </>
        )}
        {activeTab === "Usage" && <TeamUsage teamId={teamId} />}
        {activeTab === "Settings" && (
          <TeamSettings
            teamId={teamId}
            teamSlug={teamSlug}
            teamName={teamName}
            isPersonal={isPersonal}
          />
        )}
      </main>
    </>
  );
}
