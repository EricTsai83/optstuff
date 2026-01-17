"use client";

import {
  ProjectDetailView,
  type Project,
  type Team,
} from "@/modules/project-detail";

type ProjectDetailContentProps = {
  readonly project: Project;
  readonly team: Team;
};

export function ProjectDetailContent({
  project,
  team,
}: ProjectDetailContentProps) {
  return <ProjectDetailView project={project} team={team} />;
}
