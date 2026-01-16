"use client";

import { Activity } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { api } from "@/trpc/react";
import { formatBytes, formatNumber } from "@/lib/format";
import { USAGE_LIMITS } from "@/lib/constants";
import { UsageProgressBar } from "./usage-progress-bar";

type TeamUsageProps = {
  readonly teamId: string;
};

export function TeamUsage({ teamId }: TeamUsageProps) {
  const { data: teamSummary, isLoading } = api.usage.getTeamSummary.useQuery(
    { teamId },
    { enabled: !!teamId }
  );

  const { data: projects } = api.project.list.useQuery({ teamId });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="bg-muted h-8 w-20 animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const requestPercentage = Math.min(
    ((teamSummary?.totalRequests ?? 0) / USAGE_LIMITS.requests) * 100,
    100
  );
  const bandwidthPercentage = Math.min(
    ((teamSummary?.totalBytes ?? 0) / USAGE_LIMITS.bandwidth) * 100,
    100
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Requests"
          value={formatNumber(teamSummary?.totalRequests ?? 0)}
          subtitle="Last 30 days"
          icon={<Activity className="text-muted-foreground h-4 w-4" />}
        />
        <StatCard
          title="Total Bandwidth"
          value={formatBytes(teamSummary?.totalBytes ?? 0)}
          subtitle="Last 30 days"
          icon={<Activity className="text-muted-foreground h-4 w-4" />}
        />
        <StatCard
          title="Projects"
          value={String(teamSummary?.projectCount ?? 0)}
          subtitle="Active projects"
        />
        <StatCard title="Plan" value="Free" subtitle="Current plan" />
      </div>

      {/* Usage Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Overview</CardTitle>
          <CardDescription>
            Your usage for the current billing period
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <UsageProgressBar
            label="API Requests"
            used={teamSummary?.totalRequests ?? 0}
            total={USAGE_LIMITS.requests}
            format={formatNumber}
            showPercentage
          />
          <UsageProgressBar
            label="Bandwidth"
            used={teamSummary?.totalBytes ?? 0}
            total={USAGE_LIMITS.bandwidth}
            format={formatBytes}
            showPercentage
          />
        </CardContent>
      </Card>

      {/* Projects Breakdown */}
      {projects && projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Usage by Project</CardTitle>
            <CardDescription>
              Breakdown of usage across your projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects.map((project) => (
                <ProjectUsageRow
                  key={project.id}
                  projectId={project.id}
                  projectName={project.name}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

type StatCardProps = {
  readonly title: string;
  readonly value: string;
  readonly subtitle: string;
  readonly icon?: React.ReactNode;
};

function StatCard({ title, value, subtitle, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-muted-foreground text-xs">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function ProjectUsageRow({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const { data: summary } = api.usage.getSummary.useQuery({ projectId });

  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <span className="font-medium">{projectName}</span>
      <div className="text-muted-foreground flex items-center gap-4 text-sm">
        <span>{formatNumber(summary?.totalRequests ?? 0)} requests</span>
        <span>{formatBytes(summary?.totalBytes ?? 0)}</span>
      </div>
    </div>
  );
}
