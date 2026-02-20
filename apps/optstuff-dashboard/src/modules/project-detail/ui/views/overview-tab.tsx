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
import { CopyButton } from "@workspace/ui/components/copy-button";
import { Activity, Globe, HardDrive, Key } from "lucide-react";
import type { Project } from "../../types";
import { StatCard } from "../components/stat-card";

type OverviewTabProps = {
  readonly project: Project;
};

export function OverviewTab({ project }: OverviewTabProps) {
  const { data: apiKeys } = api.apiKey.list.useQuery({ projectId: project.id });
  const { data: usageSummary } = api.usage.getSummary.useQuery({
    projectId: project.id,
  });

  const projectEndpoint = `${env.NEXT_PUBLIC_APP_URL}/api/v1/${project.slug}`;

  return (
    <div className="space-y-6">
      {/* Endpoint Info */}
      <Card>
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
          <div className="bg-muted flex items-center gap-2 rounded-lg p-3 sm:p-4">
            <code className="min-w-0 flex-1 truncate font-mono text-xs sm:text-sm">
              {projectEndpoint}
            </code>
            <CopyButton text={projectEndpoint} className="bg-secondary shrink-0" />
          </div>
          <p className="text-muted-foreground mt-3 text-xs sm:text-sm">
            <strong>URL Format:</strong>{" "}
            <code className="bg-muted rounded px-1 text-[11px] sm:text-sm">
              {projectEndpoint}/&#123;operations&#125;/&#123;imageUrl&#125;
            </code>
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
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
          icon={<HardDrive className="text-muted-foreground h-4 w-4" />}
        />
      </div>
    </div>
  );
}
