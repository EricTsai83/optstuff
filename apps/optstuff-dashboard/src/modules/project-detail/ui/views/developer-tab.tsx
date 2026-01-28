"use client";

import type { Project } from "../../types";
import { DeveloperSnippets } from "../components/developer-snippets";
import { UrlTester } from "../components/url-tester";

type DeveloperTabProps = {
  readonly project: Project;
};

/** Get the API base URL - uses current origin on client, empty string during SSR */
function getApiBase(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

export function DeveloperTab({ project }: DeveloperTabProps) {
  const apiBase = getApiBase();
  const apiEndpoint = `${apiBase}/api/v1`;

  return (
    <div className="space-y-6">
      <DeveloperSnippets projectSlug={project.slug} apiEndpoint={apiEndpoint} />
      <UrlTester projectSlug={project.slug} apiEndpoint={apiEndpoint} />
    </div>
  );
}
