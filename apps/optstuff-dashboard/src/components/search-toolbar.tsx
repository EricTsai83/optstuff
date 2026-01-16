"use client";

import { Search, X } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { CreateProjectDialog } from "./create-project-dialog";

type SearchToolbarProps = {
  readonly teamId: string;
  readonly teamSlug: string;
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
};

export function SearchToolbar({
  teamId,
  teamSlug,
  searchQuery,
  onSearchChange,
}: SearchToolbarProps) {
  return (
    <div className="flex items-center gap-2 py-4">
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search projects..."
          className="bg-background h-10 w-full pr-9 pl-9"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <CreateProjectDialog teamId={teamId} teamSlug={teamSlug} />
    </div>
  );
}
