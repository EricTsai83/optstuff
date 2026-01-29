"use client";

import { env } from "@/env";
import type { Project } from "../../types";
import { DeveloperSnippets } from "../components/developer-snippets";
import { UrlTester } from "../components/url-tester";

type DeveloperTabProps = {
  readonly project: Project;
};

export function DeveloperTab({ project }: DeveloperTabProps) {
  // Remove trailing slashes to prevent double slashes in URL construction
  const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  const apiEndpoint = `${baseUrl}/api/v1`;

  return (
    <div className="space-y-6">
      <DeveloperSnippets projectSlug={project.slug} apiEndpoint={apiEndpoint} />
      <UrlTester projectSlug={project.slug} apiEndpoint={apiEndpoint} />
    </div>
  );
}
