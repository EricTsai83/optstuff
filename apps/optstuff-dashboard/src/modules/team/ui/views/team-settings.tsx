"use client";

import { api } from "@/trpc/react";
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

type TeamSettingsProps = {
  readonly teamId: string;
  readonly teamSlug: string;
  readonly teamName: string;
  readonly isPersonal: boolean;
};

export function TeamSettings({
  teamId,
  teamSlug,
  teamName,
  isPersonal,
}: TeamSettingsProps) {
  const router = useRouter();
  const [name, setName] = useState(teamName);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const utils = api.useUtils();

  const { mutate: updateTeam, isPending: isUpdating } =
    api.team.update.useMutation({
      onSuccess: (updatedTeam) => {
        utils.team.list.invalidate();
        if (updatedTeam?.slug && updatedTeam.slug !== teamSlug) {
          router.push(`/${updatedTeam.slug}`);
        }
      },
    });

  const { mutate: deleteTeam, isPending: isDeleting } =
    api.team.delete.useMutation({
      onSuccess: () => {
        utils.team.list.invalidate();
        router.push("/");
      },
    });

  const handleUpdateName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name === teamName) return;
    updateTeam({ teamId, name: name.trim() });
  };

  const handleDelete = () => {
    if (confirmText !== teamName) return;
    deleteTeam({ teamId });
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Team Information */}
      <Card>
        <CardHeader>
          <CardTitle>Team Information</CardTitle>
          <CardDescription>
            Manage your team settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleUpdateName} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isUpdating || isPersonal}
                placeholder="My Team"
              />
              {isPersonal && (
                <p className="text-muted-foreground text-xs">
                  Personal team name cannot be changed
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Team Slug</Label>
              <Input value={teamSlug} disabled className="bg-muted" />
              <p className="text-muted-foreground text-xs">
                Used in URLs to identify your team
              </p>
            </div>
            {!isPersonal && (
              <Button
                type="submit"
                disabled={isUpdating || !name.trim() || name === teamName}
              >
                {isUpdating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Manage who has access to this team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex flex-col items-center py-8 text-center">
            <p className="text-sm">Team member management coming soon</p>
            <p className="mt-1 text-xs">
              You&apos;ll be able to invite team members and manage their
              permissions
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      {!isPersonal && (
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
                <h4 className="font-medium">Delete Team</h4>
                <p className="text-muted-foreground text-sm">
                  Permanently delete this team and all its projects
                </p>
              </div>
              <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={(open) => {
                  if (!open && isDeleting) return; // Prevent closing while deleting
                  setIsDeleteDialogOpen(open);
                  if (!open) setConfirmText("");
                }}
              >
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete Team</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Team</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      the team <strong>{teamName}</strong> and all associated
                      projects, API keys, and usage records.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-4">
                    <Label className="text-sm font-medium">
                      Type <strong>{teamName}</strong> to confirm
                    </Label>
                    <Input
                      className="mt-2"
                      placeholder={teamName}
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      disabled={isDeleting}
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={confirmText !== teamName || isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Delete Team
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
