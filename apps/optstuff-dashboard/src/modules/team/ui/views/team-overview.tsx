"use client";

import { useState } from "react";
import { MobileTabs } from "../components/mobile-tabs";
import { ProjectList } from "../components/project-list";
import { SearchToolbar } from "../components/search-toolbar";
import { UsageSidebar } from "../components/usage-sidebar";

type TeamOverviewProps = {
  readonly teamId: string;
  readonly teamSlug: string;
};

export function TeamOverview({ teamId, teamSlug }: TeamOverviewProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      <SearchToolbar
        teamId={teamId}
        teamSlug={teamSlug}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <MobileTabs teamId={teamId} />
      <div className="flex gap-8 pt-4">
        <UsageSidebar teamId={teamId} />
        <ProjectList
          teamId={teamId}
          teamSlug={teamSlug}
          searchQuery={searchQuery}
        />
      </div>
    </>
  );
}
