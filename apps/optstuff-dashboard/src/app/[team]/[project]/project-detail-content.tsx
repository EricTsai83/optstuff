"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Settings,
  Key,
  Activity,
  LayoutDashboard,
  Loader2,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import { Input } from "@workspace/ui/components/input";
import { ApiKeyList } from "@/components/api-key-list";
import { api } from "@/trpc/react";
import { formatBytes, formatNumber } from "@/lib/format";

type Project = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date;
};

type Team = {
  id: string;
  name: string;
  slug: string;
  isPersonal: boolean;
};

type ProjectDetailContentProps = {
  readonly project: Project;
  readonly team: Team;
};

type Tab = "overview" | "api-keys" | "usage" | "settings";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: "api-keys", label: "API Keys", icon: <Key className="h-4 w-4" /> },
  { id: "usage", label: "Usage", icon: <Activity className="h-4 w-4" /> },
  { id: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
];

export function ProjectDetailContent({ project, team }: ProjectDetailContentProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <>
      {/* Project Header */}
      <div className="border-border border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/${team.slug}`}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold">{project.name}</h1>
                <Badge variant="secondary">{team.name}</Badge>
              </div>
              {project.description && (
                <p className="text-muted-foreground mt-1 text-sm">
                  {project.description}
                </p>
              )}
            </div>
            <div className="text-muted-foreground hidden text-sm md:block">
              Created{" "}
              {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <nav className="container mx-auto px-4">
          <div className="scrollbar-hide flex overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.id
                    ? "border-foreground text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:border-muted-foreground border-transparent"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* Tab Content */}
      <main className="container mx-auto flex-1 px-4 py-6">
        {activeTab === "overview" && <OverviewTab project={project} />}
        {activeTab === "api-keys" && <ApiKeyList projectId={project.id} />}
        {activeTab === "usage" && <UsageTab projectId={project.id} />}
        {activeTab === "settings" && <SettingsTab project={project} team={team} />}
      </main>
    </>
  );
}

function OverviewTab({ project }: { project: Project }) {
  const { data: apiKeys } = api.apiKey.list.useQuery({ projectId: project.id });
  const { data: usageSummary } = api.usage.getSummary.useQuery({ projectId: project.id });

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
              { step: 1, title: "Create an API Key", desc: "Generate an API key from the API Keys tab" },
              { step: 2, title: "Make API Requests", desc: "Use your API key to optimize images" },
              { step: 3, title: "Monitor Usage", desc: "Track your API usage in the Usage tab" },
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

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon?: React.ReactNode;
}) {
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

function UsageTab({ projectId }: { projectId: string }) {
  const { data: usageSummary, isLoading } = api.usage.getSummary.useQuery({ projectId });
  const { data: dailyUsage } = api.usage.getDailyUsage.useQuery({
    projectId,
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!,
    endDate: new Date().toISOString().split("T")[0]!,
  });

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="bg-muted h-8 w-20 animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <SimpleStatCard title="Total Requests" value={formatNumber(usageSummary?.totalRequests ?? 0)} />
        <SimpleStatCard title="Total Bandwidth" value={formatBytes(usageSummary?.totalBytes ?? 0)} />
        <SimpleStatCard title="Avg Daily Requests" value={formatNumber(usageSummary?.averageDailyRequests ?? 0)} />
        <SimpleStatCard title="Avg Daily Bandwidth" value={formatBytes(usageSummary?.averageDailyBytes ?? 0)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Usage</CardTitle>
          <CardDescription>Last 30 days of API usage</CardDescription>
        </CardHeader>
        <CardContent>
          {!dailyUsage?.length ? (
            <div className="text-muted-foreground py-8 text-center">No usage data yet</div>
          ) : (
            <div className="space-y-2">
              {dailyUsage.slice(0, 10).map((day) => (
                <div key={day.date} className="bg-muted/50 flex items-center justify-between rounded-lg px-4 py-2">
                  <span className="text-sm">{day.date}</span>
                  <div className="flex items-center gap-6">
                    <span className="text-muted-foreground text-sm">
                      {formatNumber(day.requestCount)} requests
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {formatBytes(day.bytesProcessed)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SimpleStatCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-sm font-normal">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function SettingsTab({ project, team }: { project: Project; team: Team }) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const utils = api.useUtils();
  const { mutate: deleteProject, isPending: isDeleting } = api.project.delete.useMutation({
    onSuccess: () => {
      utils.project.list.invalidate();
      utils.project.listPinned.invalidate();
      router.push(`/${team.slug}`);
    },
  });

  const handleDelete = () => {
    if (confirmText !== project.name) return;
    deleteProject({ projectId: project.id });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
          <CardDescription>Basic information about this project</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoField label="Project Name" value={project.name} />
          <InfoField label="Project Slug" value={project.slug} mono />
          <InfoField
            label="Description"
            value={project.description || <span className="text-muted-foreground italic">No description</span>}
          />
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Delete Project</h4>
              <p className="text-muted-foreground text-sm">
                Permanently delete this project and all its data
              </p>
            </div>
            <AlertDialog
              open={isDeleteDialogOpen}
              onOpenChange={(open) => {
                setIsDeleteDialogOpen(open);
                if (!open) setConfirmText("");
              }}
            >
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete Project</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Project</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the project{" "}
                    <strong>{project.name}</strong> and all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                  <label className="text-sm font-medium">
                    Type <strong>{project.name}</strong> to confirm
                  </label>
                  <Input
                    className="mt-2"
                    placeholder={project.name}
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    disabled={isDeleting}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={confirmText !== project.name || isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Delete Project
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoField({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="text-muted-foreground text-sm font-medium">{label}</label>
      <p className={`mt-1 ${mono ? "font-mono text-sm" : ""}`}>{value}</p>
    </div>
  );
}
