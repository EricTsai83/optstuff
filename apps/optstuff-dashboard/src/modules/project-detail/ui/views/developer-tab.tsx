"use client";

import { env } from "@/env";
import type { Project } from "../../types";
import { DeveloperSnippets } from "../components/developer-snippets";
import { UrlTester } from "../components/url-tester";

type DeveloperTabProps = {
  readonly project: Project;
};

// API endpoint - in production this would come from env or be configured
const API_ENDPOINT =
  env.NEXT_PUBLIC_API_ENDPOINT ?? "https://api.optstuff.dev/api/v1";

export function DeveloperTab({ project }: DeveloperTabProps) {
  return (
    <div className="space-y-6">
      <DeveloperSnippets projectSlug={project.slug} apiEndpoint={API_ENDPOINT} />
      <UrlTester projectSlug={project.slug} apiEndpoint={API_ENDPOINT} />
    </div>
  );
}
