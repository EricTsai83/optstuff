"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  GitBranch,
  MoreHorizontal,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const projects = [
  {
    id: "erictsai-dev",
    name: "erictsai-dev",
    url: "erictsai-dev.vercel.app",
    commit:
      "update next.js to version 14.2.35 in package.json and package-lock.json",
    date: "Dec 12",
    branch: "main",
    repo: "EricTsai83/erictsai.dev",
    icon: "E",
    iconBg: "bg-foreground text-background",
    hasWarning: false,
    isFavorite: true,
  },
  {
    id: "document",
    name: "document",
    url: "eric-document.vercel.app",
    commit: "update next.js version to 15.0.7 and update bun.lockb",
    date: "Dec 12",
    branch: "main",
    repo: "EricTsai83/document",
    icon: "📄",
    iconBg: "bg-secondary",
    hasWarning: false,
    isFavorite: true,
  },
  {
    id: "blog",
    name: "blog",
    url: "ericts.com",
    commit: "update next.js version to 15.0.7 in package.json",
    date: "Dec 12",
    branch: "main",
    repo: "EricTsai83/blog",
    icon: "",
    iconBg: "",
    iconImage: "/diverse-user-avatars.png",
    hasWarning: false,
    isFavorite: false,
  },
  {
    id: "google-drive-clone",
    name: "google-drive-clone",
    url: "google-drive-clone-amber.vercel...",
    commit: "Update dependencies and add .pnpm-store to .git...",
    date: "Dec 12",
    branch: "main",
    repo: "EricTsai83/google-dri...",
    icon: "🔷",
    iconBg: "bg-green-500",
    hasWarning: false,
    isFavorite: false,
  },
  {
    id: "drawstuff",
    name: "drawstuff",
    url: "drawstuff-ericts.vercel.app",
    commit: "Update Next.js dependency from 16.0.7 to 16.0.10 in ...",
    date: "Dec 12",
    branch: "main",
    repo: "EricTsai83/drawstuff",
    icon: "✖",
    iconBg: "bg-pink-500",
    hasWarning: true,
    isFavorite: false,
  },
  {
    id: "optimize-stuff",
    name: "optimize-stuff",
    url: "optstuff.vercel.app",
    commit: "Merge pull request #12 from EricTsai83/feat/copy-bu...",
    date: "15h ago",
    branch: "main",
    repo: "EricTsai83/optstuff",
    icon: "🟢",
    iconBg: "bg-green-500",
    hasWarning: false,
    isFavorite: false,
  },
  {
    id: "v0-generate-api-keys",
    name: "v0-generate-api-keys",
    url: "v0-generate-api-keys.vercel.app",
    commit: "",
    date: "15h ago",
    branch: "",
    repo: "",
    icon: "▲",
    iconBg: "bg-secondary",
    hasWarning: false,
    isFavorite: false,
  },
  {
    id: "viz-maker",
    name: "viz-maker",
    url: "viz-maker.vercel.app",
    commit: "Update Next.js to version 15.2.8 and add .pnpm-stor...",
    date: "Dec 12",
    branch: "main",
    repo: "EricTsai83/viz-maker",
    icon: "▲",
    iconBg: "bg-foreground text-background",
    hasWarning: false,
    isFavorite: false,
  },
  {
    id: "registry-template-v4",
    name: "registry-template-v4",
    url: "registry-template-v4-roan.vercel...",
    commit: "update next.js to version 15.3.8 and add .pnpm-st...",
    date: "Dec 12",
    branch: "main",
    repo: "EricTsai83/registry-te...",
    icon: "▲",
    iconBg: "bg-foreground text-background",
    hasWarning: false,
    isFavorite: false,
  },
];

type Project = (typeof projects)[number];

type ProjectItemProps = {
  readonly project: Project;
  readonly index: number;
};

const ProjectItem = ({ project, index }: ProjectItemProps) => {
  return (
    <div
      key={project.id}
      className="hover:bg-secondary/50 group animate-in fade-in slide-in-from-bottom-2 flex cursor-pointer flex-col gap-2 rounded-lg p-3 transition-all duration-200 md:flex-row md:items-center md:gap-4"
      style={{
        animationDelay: `${index * 50}ms`,
        animationFillMode: "both",
      }}
    >
      {/* Project icon and basic info row */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {/* Project icon */}
        {project.iconImage ? (
          <img
            src={project.iconImage || "/placeholder.svg"}
            alt={project.name}
            className="h-10 w-10 rounded-lg object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-medium transition-transform duration-200 group-hover:scale-105 ${project.iconBg}`}
          >
            {project.icon}
          </div>
        )}

        {/* Project info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{project.name}</span>
          </div>
          <span className="text-muted-foreground block truncate text-sm">
            {project.url}
          </span>
        </div>

        {/* Actions - visible on mobile at end of row */}
        <div className="flex items-center gap-1 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 transition-colors duration-200"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 transition-colors duration-200"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 pl-13 md:hidden">
        {project.repo && (
          <Badge
            variant="outline"
            className="inline-flex items-center gap-1 text-xs font-normal"
          >
            <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            {project.repo}
          </Badge>
        )}
        {project.commit && (
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm">{project.commit}</p>
            <p className="text-muted-foreground flex items-center gap-1 text-xs">
              {project.date} on <GitBranch className="h-3 w-3" />{" "}
              {project.branch}
            </p>
          </div>
        )}
        {!project.commit && project.date && (
          <span className="text-muted-foreground text-sm">{project.date}</span>
        )}
      </div>

      {/* Desktop: Commit info */}
      <div className="hidden max-w-xs min-w-0 flex-1 flex-col items-start md:flex">
        {project.commit && (
          <>
            <span className="text-muted-foreground w-full truncate text-sm">
              {project.commit}
            </span>
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              {project.date} on <GitBranch className="h-3 w-3" />{" "}
              {project.branch}
            </span>
          </>
        )}
        {!project.commit && project.date && (
          <span className="text-muted-foreground text-sm">{project.date}</span>
        )}
      </div>

      {/* Desktop: GitHub repo badge */}
      {project.repo && (
        <Badge
          variant="outline"
          className="hover:bg-secondary hidden items-center gap-1 text-xs font-normal transition-colors duration-200 lg:flex"
        >
          <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          {project.repo}
        </Badge>
      )}

      {/* Desktop: Actions */}
      <div className="hidden items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:flex">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 transition-colors duration-200"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </Button>
        {project.hasWarning && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-yellow-500"
          >
            <AlertTriangle className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 transition-colors duration-200"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

type ProjectSectionProps = {
  readonly title: string;
  readonly projects: readonly Project[];
  readonly isExpanded?: boolean;
  readonly onToggleExpanded?: () => void;
  readonly initialVisibleCount?: number;
  readonly collapsible?: boolean;
};

const ProjectSection = ({
  title,
  projects,
  isExpanded = true,
  onToggleExpanded,
  initialVisibleCount = 6,
  collapsible = true,
}: ProjectSectionProps) => {
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);

  const visibleProjects = projects.slice(0, visibleCount);
  const hasMore = visibleCount < projects.length;

  const handleShowMore = () => {
    setVisibleCount((prev) => Math.min(prev + 3, projects.length));
  };

  if (projects.length === 0) {
    return null;
  }

  const shouldShowContent = collapsible ? isExpanded : true;

  return (
    <div className="mb-8">
      {collapsible ? (
        <button
          onClick={onToggleExpanded}
          className="hover:bg-secondary/50 mb-4 -ml-2 flex items-center gap-2 rounded-md px-2 py-1 transition-all duration-200 active:scale-95"
        >
          <span className="transition-transform duration-200">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
          <h2 className="text-sm font-medium">{title}</h2>
        </button>
      ) : (
        <h2 className="mb-4 text-sm font-medium">{title}</h2>
      )}

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          shouldShowContent
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-1">
            {visibleProjects.map((project, index) => (
              <ProjectItem key={project.id} project={project} index={index} />
            ))}
          </div>

          {hasMore && (
            <Button
              variant="outline"
              className="hover:bg-secondary mt-4 w-full bg-transparent transition-all duration-200 active:scale-[0.98]"
              onClick={handleShowMore}
            >
              Show More
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export function ProjectList() {
  const [isFavoritesExpanded, setIsFavoritesExpanded] = useState(true);

  const favoriteProjects = projects.filter((project) => project.isFavorite);
  const allProjects = projects.filter((project) => !project.isFavorite);

  return (
    <div className="min-w-0 flex-1">
      <ProjectSection
        title="Your Favorites"
        projects={favoriteProjects}
        isExpanded={isFavoritesExpanded}
        onToggleExpanded={() => setIsFavoritesExpanded(!isFavoritesExpanded)}
        collapsible={true}
      />

      <ProjectSection
        title="All Projects"
        projects={allProjects}
        collapsible={false}
      />
    </div>
  );
}
