"use client";

import { env } from "@/env";
import { formatBytes, formatNumber } from "@/lib/format";
import { api } from "@/trpc/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Activity, Globe, Key } from "lucide-react";
import type { Project } from "../../types";
import { CopyButton } from "../components/copy-button";
import { StatCard } from "../components/stat-card";

type OverviewTabProps = {
  readonly project: Project;
};

// API endpoint
const API_ENDPOINT =
  env.NEXT_PUBLIC_API_ENDPOINT ?? "https://api.optstuff.dev/api/v1";

export function OverviewTab({ project }: OverviewTabProps) {
  const { data: apiKeys } = api.apiKey.list.useQuery({ projectId: project.id });
  const { data: usageSummary } = api.usage.getSummary.useQuery({
    projectId: project.id,
  });

  const projectEndpoint = `${API_ENDPOINT}/${project.slug}`;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Endpoint Info */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            API Endpoint
          </CardTitle>
          <CardDescription>
            Use this endpoint to optimize images for this project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted flex items-center gap-2 rounded-lg p-4">
            <code className="flex-1 truncate font-mono text-sm">
              {projectEndpoint}
            </code>
            <CopyButton text={projectEndpoint} variant="secondary" />
          </div>
          <p className="text-muted-foreground mt-3 text-sm">
            <strong>URL Format:</strong>{" "}
            <code className="bg-muted rounded px-1">
              {projectEndpoint}/&#123;operations&#125;/&#123;imageUrl&#125;
            </code>
          </p>
        </CardContent>
      </Card>

      <StatCard
        title="API Keys"
        value={String(apiKeys?.length ?? 0)}
        subtitle="Active keys"
        icon={<Key className="text-muted-foreground h-4 w-4" />}
      />
      <StatCard
        title="API Requests"
        value={formatNumber(usageSummary?.totalRequests ?? 0)}
        subtitle="Last 30 days"
        icon={<Activity className="text-muted-foreground h-4 w-4" />}
      />
      <StatCard
        title="Bandwidth"
        value={formatBytes(usageSummary?.totalBytes ?? 0)}
        subtitle="Last 30 days"
        icon={<Activity className="text-muted-foreground h-4 w-4" />}
      />

      {/* Quick Start Guide */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
          <CardDescription>
            Get started with image optimization in a few simple steps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                step: 1,
                title: "Create an API Key",
                desc: "Generate an API key from the API Keys tab",
              },
              {
                step: 2,
                title: "Make API Requests",
                desc: "Use your API key to optimize images",
              },
              {
                step: 3,
                title: "Monitor Usage",
                desc: "Track your API usage in the Usage tab",
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-3">
                <div className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-medium">
                  {step}
                </div>
                <div>
                  <h4 className="font-medium">{title}</h4>
                  <p className="text-muted-foreground text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
