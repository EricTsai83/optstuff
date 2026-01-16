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

type TeamUsageProps = {
  readonly teamId: string;
};

export function TeamUsage({ teamId }: TeamUsageProps) {
  const { data: teamSummary, isLoading } = api.usage.getTeamSummary.useQuery(
    { teamId },
    { enabled: !!teamId },
  );

  const { data: projects } = api.project.list.useQuery({ teamId });

  // Define usage limits
  const limits = {
    requests: 10000,
    bandwidth: 1024 * 1024 * 1024, // 1GB
  };

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
    ((teamSummary?.totalRequests ?? 0) / limits.requests) * 100,
    100,
  );
  const bandwidthPercentage = Math.min(
    ((teamSummary?.totalBytes ?? 0) / limits.bandwidth) * 100,
    100,
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Requests
            </CardTitle>
            <Activity className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(teamSummary?.totalRequests ?? 0)}
            </div>
            <p className="text-muted-foreground text-xs">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Bandwidth
            </CardTitle>
            <Activity className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(teamSummary?.totalBytes ?? 0)}
            </div>
            <p className="text-muted-foreground text-xs">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamSummary?.projectCount ?? 0}
            </div>
            <p className="text-muted-foreground text-xs">Active projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Free</div>
            <p className="text-muted-foreground text-xs">Current plan</p>
          </CardContent>
        </Card>
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
            total={limits.requests}
            percentage={requestPercentage}
            format={formatNumber}
          />
          <UsageProgressBar
            label="Bandwidth"
            used={teamSummary?.totalBytes ?? 0}
            total={limits.bandwidth}
            percentage={bandwidthPercentage}
            format={formatBytes}
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

type UsageProgressBarProps = {
  label: string;
  used: number;
  total: number;
  percentage: number;
  format: (value: number) => string;
};

function UsageProgressBar({
  label,
  used,
  total,
  percentage,
  format,
}: UsageProgressBarProps) {
  const isWarning = percentage > 80;
  const isDanger = percentage > 95;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-muted-foreground text-sm">
          {format(used)} / {format(total)}
        </span>
      </div>
      <div className="bg-muted h-2 overflow-hidden rounded-full">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isDanger
              ? "bg-red-500"
              : isWarning
                ? "bg-yellow-500"
                : "bg-green-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-muted-foreground text-xs">
        {percentage.toFixed(1)}% used
      </p>
    </div>
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
