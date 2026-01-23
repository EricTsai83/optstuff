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
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Project, Team } from "../../types";
import { InfoField } from "../components/info-field";

type SettingsTabProps = {
  readonly project: Project;
  readonly team: Team;
};

export function SettingsTab({ project, team }: SettingsTabProps) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const utils = api.useUtils();
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
          <InfoField label="Project Name" value={project.name} />
          <InfoField label="Project Slug" value={project.slug} mono />
          <InfoField
            label="Description"
            value={
              project.description || (
                <span className="text-muted-foreground italic">
                  No description
                </span>
              )
            }
          />
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
                  <Label htmlFor={`confirm-delete-${project.id}`}>
                    Type <strong>{project.name}</strong> to confirm
                  </Label>
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
                  <Button
                    onClick={handleDelete}
                    disabled={confirmText !== project.name || isDeleting}
                    variant="destructive"
                  >
                    {isDeleting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Delete Project
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
