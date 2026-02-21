"use client";

import { api } from "@/trpc/react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { LoadingButton } from "@workspace/ui/components/loading-button";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Project, Team } from "../../types";
import { DomainListInput } from "../components/domain-list-input";
import { InfoField } from "../components/info-field";

type SettingsTabProps = {
  readonly project: Project;
  readonly team: Team;
};

export function SettingsTab({ project, team }: SettingsTabProps) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Project information state
  const [projectName, setProjectName] = useState(project.name);
  const [projectDescription, setProjectDescription] = useState(
    project.description ?? "",
  );
  const [hasProjectInfoChanges, setHasProjectInfoChanges] = useState(false);

  // Authorization settings state (only referer domains at project level)
  const [refererDomains, setRefererDomains] = useState<string[]>([]);
  const [hasSettingsChanges, setHasSettingsChanges] = useState(false);

  const utils = api.useUtils();

  // Track project info changes
  useEffect(() => {
    const nameChanged = projectName !== project.name;
    const descChanged = projectDescription !== (project.description ?? "");
    setHasProjectInfoChanges(nameChanged || descChanged);
  }, [projectName, projectDescription, project.name, project.description]);

  // Fetch current settings
  const { data: settings, isLoading: isLoadingSettings } =
    api.project.getSettings.useQuery({ projectId: project.id });

  // Initialize state when settings are loaded
  useEffect(() => {
    if (settings) {
      setRefererDomains(settings.allowedRefererDomains);
      setHasSettingsChanges(false);
    }
  }, [settings]);

  // Track authorization settings changes
  useEffect(() => {
    if (!settings) return;
    const refererChanged =
      JSON.stringify(refererDomains) !==
      JSON.stringify(settings.allowedRefererDomains);
    setHasSettingsChanges(refererChanged);
  }, [refererDomains, settings]);

  // Update project info mutation
  const { mutate: updateProject, isPending: isUpdatingProject } =
    api.project.update.useMutation({
      onSuccess: () => {
        utils.project.getBySlug.invalidate({
          teamSlug: team.slug,
          projectSlug: project.slug,
        });
        setHasProjectInfoChanges(false);
      },
    });

  const handleSaveProjectInfo = (): void => {
    updateProject({
      projectId: project.id,
      name: projectName,
      description: projectDescription || undefined,
    });
  };

  // Update settings mutation
  const { mutate: updateSettings, isPending: isUpdatingSettings } =
    api.project.updateSettings.useMutation({
      onSuccess: () => {
        utils.project.getSettings.invalidate({ projectId: project.id });
        setHasSettingsChanges(false);
      },
    });

  const handleSaveSettings = (): void => {
    updateSettings({
      projectId: project.id,
      allowedRefererDomains: refererDomains,
    });
  };

  const { mutate: deleteProject, isPending: isDeleting } =
    api.project.delete.useMutation({
      onSuccess: () => {
        utils.project.list.invalidate();
        utils.project.listPinned.invalidate();
        setIsDeleteDialogOpen(false);
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
          <CardDescription>
            Basic information about this project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              disabled={isUpdatingProject}
              maxLength={255}
            />
          </div>
          <InfoField label="Project Slug" value={project.slug} mono />
          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Input
              id="project-description"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              disabled={isUpdatingProject}
              placeholder="Enter a description for this project"
              maxLength={1000}
            />
          </div>
          <InfoField
            label="Created"
            value={format(new Date(project.createdAt), "PPP")}
          />
          <div className="flex justify-end">
            <LoadingButton
              onClick={handleSaveProjectInfo}
              loading={isUpdatingProject}
              disabled={!hasProjectInfoChanges || !projectName.trim()}
            >
              Save
            </LoadingButton>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Authorization Settings</CardTitle>
          <CardDescription>
            Control which websites can use your image optimization service.
            Source domain restrictions are configured per API key.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingSettings ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Allowed Referer Domains</Label>
                <p className="text-muted-foreground text-sm">
                  Define which websites can display optimized images. Leave
                  empty to allow all referers.
                </p>
                <DomainListInput
                  value={refererDomains}
                  onChange={setRefererDomains}
                  placeholder="myapp.com"
                  disabled={isUpdatingSettings}
                />
              </div>

              <div className="flex justify-end">
                <LoadingButton
                  onClick={handleSaveSettings}
                  loading={isUpdatingSettings}
                  disabled={!hasSettingsChanges}
                >
                  Save Settings
                </LoadingButton>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
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
                    This action cannot be undone. This will permanently delete
                    the project <strong>{project.name}</strong> and all
                    associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                  <p className="text-sm font-medium">
                    Type <strong className="select-all">{project.name}</strong>{" "}
                    to confirm
                  </p>
                  <Input
                    id={`confirm-delete-${project.id}`}
                    className="mt-2"
                    placeholder={project.name}
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    disabled={isDeleting}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>
                    Cancel
                  </AlertDialogCancel>
                  <LoadingButton
                    onClick={handleDelete}
                    loading={isDeleting}
                    disabled={confirmText !== project.name}
                    variant="destructive"
                  >
                    Delete Project
                  </LoadingButton>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
