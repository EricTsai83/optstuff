"use client";

import { formatBytes, formatNumber } from "@/lib/format";
import type { Project } from "@/lib/types";
import { api } from "@/trpc/react";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  Clock,
  Code,
  FolderOpen,
  Key,
  LayoutDashboard,
  MoreHorizontal,
  Pin,
  PinOff,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { getProjectColor } from "../../constants";
import { CreateProjectDialog } from "./create-project-dialog";

type ProjectListProps = {
  readonly teamId: string;
  readonly teamSlug: string;
  readonly searchQuery?: string;
};

export function ProjectList({
  teamId,
  teamSlug,
  searchQuery = "",
}: ProjectListProps) {
  const { data: projects, isLoading } = api.project.list.useQuery({ teamId });
  const { data: pinnedProjects, isLoading: isPinnedLoading } =
    api.project.listPinned.useQuery();

  const projectIds = projects?.map((p) => p.id) ?? [];
  const { data: pinnedStatus } = api.project.getPinnedStatus.useQuery(
    { projectIds },
    { enabled: projectIds.length > 0 },
  );

  const normalizedQuery = searchQuery.toLowerCase().trim();
  const filteredProjects = projects?.filter((p) =>
    normalizedQuery
      ? p.name.toLowerCase().includes(normalizedQuery) ||
      p.description?.toLowerCase().includes(normalizedQuery)
      : true,
  );

  const teamPinnedProjects =
    pinnedProjects?.filter(
      (p) =>
        projects?.some((proj) => proj.id === p.id) &&
        (normalizedQuery
          ? p.name.toLowerCase().includes(normalizedQuery) ||
          p.description?.toLowerCase().includes(normalizedQuery)
          : true),
    ) ?? [];

  if (isLoading || isPinnedLoading) {
    return (
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium">Projects</h2>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-muted h-20 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 flex-1">
      {/* Pinned Projects Section */}
      {teamPinnedProjects.length > 0 && (
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <Pin className="text-muted-foreground h-4 w-4" />
            <h2 className="text-sm font-medium">Pinned</h2>
          </div>
          <div className="space-y-2">
            {teamPinnedProjects.map((project, index) => (
              <ProjectItem
                key={project.id}
                project={project}
                teamSlug={teamSlug}
                index={index}
                isPinned
              />
            ))}
          </div>
        </div>
      )}

      {/* All Projects Section */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium">
          Projects{" "}
          {filteredProjects &&
            (searchQuery
              ? `(${filteredProjects.length} of ${projects?.length ?? 0})`
              : `(${filteredProjects.length})`)}
        </h2>
      </div>

      {!projects?.length ? (
        <EmptyProjectState teamId={teamId} teamSlug={teamSlug} />
      ) : !filteredProjects?.length ? (
        <NoSearchResults query={searchQuery} />
      ) : (
        <div className="space-y-2">
          {filteredProjects.map((project, index) => (
            <ProjectItem
              key={project.id}
              project={project}
              teamSlug={teamSlug}
              index={index}
              isPinned={pinnedStatus?.[project.id] ?? false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type ProjectWithStats = Project & {
  apiKeyCount: number;
  totalRequests: number;
  totalBandwidth: number;
  lastActivityAt: Date | null;
};

type ProjectItemProps = {
  readonly project: ProjectWithStats;
  readonly teamSlug: string;
  readonly index: number;
  readonly isPinned?: boolean;
};

function ProjectItem({
  project,
  teamSlug,
  index,
  isPinned = false,
}: ProjectItemProps) {
  const utils = api.useUtils();

  const { mutate: pinProject, isPending: isPinning } =
    api.project.pin.useMutation({
      onSuccess: () => {
        utils.project.listPinned.invalidate();
        utils.project.getPinnedStatus.invalidate();
      },
    });

  const { mutate: unpinProject, isPending: isUnpinning } =
    api.project.unpin.useMutation({
      onSuccess: () => {
        utils.project.listPinned.invalidate();
        utils.project.getPinnedStatus.invalidate();
      },
    });

  const projectColor = getProjectColor(project.name);
  const projectInitial = project.name.charAt(0).toUpperCase();

  const isMutating = isPinning || isUnpinning;

  const handlePinToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isMutating) return;
    if (isPinned) {
      unpinProject({ projectId: project.id });
    } else {
      pinProject({ projectId: project.id });
    }
  };

  return (
    <Link
      href={`/${teamSlug}/${project.slug}`}
      className="hover:bg-secondary/50 group animate-in fade-in slide-in-from-bottom-2 flex cursor-pointer items-center gap-4 rounded-lg p-3 transition-all duration-200"
      style={{
        animationDelay: `${index * 50}ms`,
        animationFillMode: "both",
      }}
    >
      {/* Project icon */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-medium text-white transition-transform duration-200 group-hover:scale-105"
        style={{ backgroundColor: projectColor }}
      >
        {projectInitial}
      </div>

      {/* Project info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{project.name}</span>
          {isPinned && <Pin className="h-3.5 w-3.5 text-amber-500" />}
        </div>
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          {project.description ? (
            <span className="max-w-[200px] truncate">
              {project.description}
            </span>
          ) : (
            <span className="text-muted-foreground/50 italic">
              No description
            </span>
          )}
          <span className="text-muted-foreground">·</span>
          <span className="shrink-0">
            {formatDistanceToNow(new Date(project.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="hidden items-center gap-3 md:flex">
        <div
          className="text-muted-foreground flex items-center gap-1.5 text-sm"
          title={`${project.apiKeyCount} active API keys`}
        >
          <Key className="h-3.5 w-3.5" />
          <span className="tabular-nums">{project.apiKeyCount}</span>
        </div>

        <div
          className="text-muted-foreground flex items-center gap-1.5 text-sm"
          title={`${project.totalRequests.toLocaleString()} requests · ${formatBytes(project.totalBandwidth)} bandwidth`}
        >
          <Activity className="h-3.5 w-3.5" />
          <span className="tabular-nums">
            {formatNumber(project.totalRequests)}
          </span>
        </div>

        {project.lastActivityAt && (
          <div
            className="text-muted-foreground flex items-center gap-1.5 text-sm"
            title="Last activity"
          >
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs">
              {formatDistanceToNow(new Date(project.lastActivityAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        )}
      </div>

      {/* Pin button */}
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 transition-opacity duration-200 ${isPinned
          ? "text-amber-500 opacity-100 hover:text-amber-600"
          : "opacity-0 group-hover:opacity-100"
          }`}
        onClick={handlePinToggle}
        disabled={isPinning || isUnpinning}
      >
        {isPinned ? (
          <PinOff className="h-4 w-4" />
        ) : (
          <Pin className="h-4 w-4" />
        )}
      </Button>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/${teamSlug}/${project.slug}`}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Overview
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/${teamSlug}/${project.slug}?tab=api-keys`}>
              <Key className="mr-2 h-4 w-4" />
              API Keys
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/${teamSlug}/${project.slug}?tab=usage`}>
              <Activity className="mr-2 h-4 w-4" />
              Usage
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/${teamSlug}/${project.slug}?tab=developer`}>
              <Code className="mr-2 h-4 w-4" />
              Developer
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/${teamSlug}/${project.slug}?tab=settings`}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handlePinToggle} disabled={isMutating}>
            {isPinned ? (
              <>
                <PinOff className="mr-2 h-4 w-4" />
                Unpin Project
              </>
            ) : (
              <>
                <Pin className="mr-2 h-4 w-4" />
                Pin Project
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Link>
  );
}

function EmptyProjectState({
  teamId,
  teamSlug,
}: {
  teamId: string;
  teamSlug: string;
}) {
  return (
    <div className="border-border flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12 text-center">
      <div className="bg-muted mb-4 flex h-12 w-12 items-center justify-center rounded-full">
        <FolderOpen className="text-muted-foreground h-6 w-6" />
      </div>
      <h3 className="font-medium">No projects yet</h3>
      <p className="text-muted-foreground mt-1 mb-4 max-w-sm text-sm">
        Create your first project to start optimizing images with API keys.
      </p>
      <CreateProjectDialog
        teamId={teamId}
        teamSlug={teamSlug}
        trigger={<Button>Create Your First Project</Button>}
      />
    </div>
  );
}

function NoSearchResults({ query }: { query: string }) {
  return (
    <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
      <FolderOpen className="mb-4 h-10 w-10 opacity-50" />
      <p className="text-sm">
        No projects found matching &quot;
        <span className="text-foreground font-medium">{query}</span>&quot;
      </p>
      <p className="mt-1 text-xs opacity-75">Try a different search term</p>
    </div>
  );
}
