"use client";

import { DOCS_LINKS } from "@/lib/constants";
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
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Code,
  Globe,
  HardDrive,
  ImageIcon,
  Key,
  Settings,
} from "lucide-react";
import Link from "next/link";
import type { Project } from "../../types";
import { StatCard } from "../components/stat-card";

type OverviewTabProps = {
  readonly project: Project;
};

function SetupChecklist({
  hasSourceDomains,
  hasApiKeys,
  teamSlug,
  projectSlug,
}: {
  hasSourceDomains: boolean;
  hasApiKeys: boolean;
  teamSlug?: string;
  projectSlug: string;
}) {
  const steps = [
    {
      done: hasSourceDomains,
      label: "Configure image sources",
      icon: ImageIcon,
      href: teamSlug
        ? `/${teamSlug}/${projectSlug}?tab=settings`
        : undefined,
      hrefLabel: "Go to Settings",
    },
    { done: hasApiKeys, label: "API key ready", icon: Key },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  if (completedCount === steps.length) return null;

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings className="h-4 w-4" />
          Complete Your Project Setup
        </CardTitle>
        <CardDescription>
          {completedCount} of {steps.length} steps completed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {steps.map((step) => (
            <li key={step.label} className="flex items-center gap-3">
              {step.done ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
              ) : (
                <Circle className="text-muted-foreground h-5 w-5 shrink-0" />
              )}
              <span
                className={
                  step.done ? "text-muted-foreground line-through" : ""
                }
              >
                {step.label}
              </span>
              {!step.done && step.href && (
                <Link
                  href={step.href}
                  className="text-primary ml-auto text-sm hover:underline"
                >
                  {step.hrefLabel}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

const RESOURCE_LINKS = [
  {
    href: DOCS_LINKS.projectSetup,
    icon: BookOpen,
    title: "Project Setup Guide",
    description: "Teams, projects, and API keys",
  },
  {
    href: DOCS_LINKS.integration,
    icon: Code,
    title: "Integration Guide",
    description: "Add OptStuff to your application",
  },
];

export function OverviewTab({ project }: OverviewTabProps) {
  const { data: apiKeys } = api.apiKey.list.useQuery({ projectId: project.id });
  const { data: usageSummary } = api.usage.getSummary.useQuery({
    projectId: project.id,
  });
  const { data: settings } = api.project.getSettings.useQuery({
    projectId: project.id,
  });

  const projectEndpoint = `${env.NEXT_PUBLIC_APP_URL}/api/v1/${project.slug}`;
  const hasSourceDomains = (settings?.allowedSourceDomains?.length ?? 0) > 0;
  const hasApiKeys = (apiKeys?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* Endpoint */}
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
            <CopyButton
              text={projectEndpoint}
              className="bg-secondary shrink-0"
            />
          </div>
          <p className="text-muted-foreground mt-3 text-xs sm:text-sm">
            <strong>URL Format:</strong>{" "}
            <code className="bg-muted rounded px-1 text-[11px] sm:text-sm">
              {projectEndpoint}/&#123;operations&#125;/&#123;imageUrl&#125;
            </code>
          </p>
        </CardContent>
      </Card>

      {/* Setup Checklist — only render once all data is loaded to avoid flash */}
      {settings && apiKeys !== undefined && (
        <SetupChecklist
          hasSourceDomains={hasSourceDomains}
          hasApiKeys={hasApiKeys}
          projectSlug={project.slug}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-6">
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

      {/* Resources */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {RESOURCE_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group border-border hover:border-primary/30 hover:bg-muted/50 flex items-center gap-3 rounded-lg border p-4 transition-colors"
          >
            <div className="bg-muted text-muted-foreground group-hover:text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors">
              <link.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{link.title}</div>
              <div className="text-muted-foreground text-xs">
                {link.description}
              </div>
            </div>
            <ArrowUpRight className="text-muted-foreground h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
          </a>
        ))}
      </div>
    </div>
  );
}
