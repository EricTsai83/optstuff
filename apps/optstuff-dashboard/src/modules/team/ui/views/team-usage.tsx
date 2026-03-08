import { UsageProgressBar } from "@/components/usage-progress-bar";
import { USAGE_LIMITS } from "@/lib/constants";
import { formatBytes, formatNumber } from "@/lib/format";
import { StatCard } from "@/modules/project-detail/ui/components/stat-card";
import { api } from "@/trpc/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Activity } from "lucide-react";

type TeamUsageProps = {
  readonly teamId: string;
};

export async function TeamUsage({ teamId }: TeamUsageProps) {
  const [teamSummary, projects] = await Promise.all([
    api.usage.getTeamSummary({ teamId }),
    api.project.list({ teamId }),
  ]);

  const projectUsages =
    projects.length > 0
      ? await Promise.all(
          projects.map(async (p) => {
            const summary = await api.usage.getSummary({ projectId: p.id });
            return {
              id: p.id,
              name: p.name,
              totalRequests: summary.totalRequests,
              totalBytes: summary.totalBytes,
            };
          }),
        )
      : [];

  const { totalRequests, totalBytes, projectCount } = teamSummary;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Requests"
          value={formatNumber(totalRequests)}
          subtitle="Last 30 days"
          icon={<Activity className="text-muted-foreground h-4 w-4" />}
        />
        <StatCard
          title="Total Bandwidth"
          value={formatBytes(totalBytes)}
          subtitle="Last 30 days"
          icon={<Activity className="text-muted-foreground h-4 w-4" />}
        />
        <StatCard
          title="Projects"
          value={String(projectCount)}
          subtitle="Active projects"
        />
        <StatCard title="Plan" value="Free" subtitle="Current plan" />
      </div>

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
            used={totalRequests}
            total={USAGE_LIMITS.requests}
            format={formatNumber}
            showPercentage
          />
          <UsageProgressBar
            label="Bandwidth"
            used={totalBytes}
            total={USAGE_LIMITS.bandwidth}
            format={formatBytes}
            showPercentage
          />
        </CardContent>
      </Card>

      {projectUsages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Usage by Project</CardTitle>
            <CardDescription>
              Breakdown of usage across your projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projectUsages.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <span className="font-medium">{project.name}</span>
                  <div className="text-muted-foreground flex items-center gap-4 text-sm">
                    <span>
                      {formatNumber(project.totalRequests)} requests
                    </span>
                    <span>{formatBytes(project.totalBytes)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
