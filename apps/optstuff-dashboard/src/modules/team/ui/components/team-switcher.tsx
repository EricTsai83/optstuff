"use client";

import { api } from "@/trpc/react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Check, ChevronDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Team } from "../../types";
import { CreateTeamDialog } from "./create-team-dialog";

type TeamSwitcherProps = {
  readonly currentTeamSlug?: string;
};

export function TeamSwitcher({ currentTeamSlug }: TeamSwitcherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Get all teams the user owns
  const { data: teams, isLoading } = api.team.list.useQuery();

  const currentTeam =
    teams?.find((t: Team) => t.slug === currentTeamSlug) ?? teams?.[0];

  const handleTeamSelect = (team: Team) => {
    setIsOpen(false);
    router.push(`/${team.slug}`);
  };

  if (isLoading) {
    return (
      <div className="flex h-8 items-center gap-2 px-2">
        <div className="bg-muted h-5 w-5 animate-pulse rounded-full" />
        <div className="bg-muted h-4 w-24 animate-pulse rounded" />
      </div>
    );
  }

  const teamColor = currentTeam?.isPersonal ? "bg-orange-500" : "bg-blue-500";

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="group flex h-8 items-center gap-2 px-2 transition-colors duration-200"
        >
          <div className={`h-5 w-5 rounded-full ${teamColor}`} />
          <span className="max-w-[150px] truncate font-medium">
            {currentTeam?.name ?? "Select Team"}
          </span>
          {currentTeam?.isPersonal && (
            <Badge
              variant="secondary"
              className="hidden text-xs font-normal md:inline-flex"
            >
              Personal
            </Badge>
          )}
          <ChevronDown className="text-muted-foreground h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <div className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
          Teams
        </div>
        {teams?.map((team: Team) => (
          <DropdownMenuItem
            key={team.id}
            onClick={() => handleTeamSelect(team)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div
                className={`h-4 w-4 rounded-full ${team.isPersonal ? "bg-orange-500" : "bg-blue-500"
                  }`}
              />
              <span className="truncate">{team.name}</span>
              {team.isPersonal && (
                <Badge variant="outline" className="text-xs">
                  Personal
                </Badge>
              )}
            </div>
            {team.slug === currentTeamSlug && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <CreateTeamDialog
          trigger={
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Plus className="mr-2 h-4 w-4" />
              Create Team
            </DropdownMenuItem>
          }
          onSuccess={() => setIsOpen(false)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
