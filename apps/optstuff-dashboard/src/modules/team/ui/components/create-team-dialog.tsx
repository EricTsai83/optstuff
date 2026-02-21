"use client";

import { generateRandomSlug, generateSlug } from "@/lib/slug";
import { api } from "@/trpc/react";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { LoadingButton } from "@workspace/ui/components/loading-button";
import { Check, Loader2, RefreshCw, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type CreateTeamDialogProps = {
  readonly trigger: React.ReactNode;
  readonly onSuccess?: () => void;
};

export function CreateTeamDialog({
  trigger,
  onSuccess,
}: CreateTeamDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const utils = api.useUtils();

  // Validate slug format using regex - must be lowercase letters, numbers, and hyphens only
  // (no leading/trailing hyphens, no consecutive hyphens)
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const isSlugFormatValid = slug.length >= 3 && slugRegex.test(slug);

  // Check slug availability - only query when format is valid
  const { data: slugCheck, isFetching: isCheckingSlug } =
    api.team.checkSlugAvailable.useQuery(
      { slug },
      {
        enabled: isSlugFormatValid,
        staleTime: 0,
      },
    );

  const { mutate: createTeam, isPending } = api.team.create.useMutation({
    onSuccess: (team) => {
      void utils.team.list.invalidate();
      setOpen(false);
      resetForm();
      onSuccess?.();
      if (team?.slug) {
        router.push(`/${team.slug}`);
      }
    },
    onError: (error) => {
      if (error.data?.code === "CONFLICT") {
        setSlugError("This slug is already taken");
      } else {
        console.error("Failed to create team:", error);
      }
    },
  });

  const resetForm = useCallback(() => {
    setName("");
    setSlug("");
    setSlugTouched(false);
    setSlugError(null);
  }, []);

  // Auto-generate slug from name if user hasn't manually edited it
  useEffect(() => {
    if (!slugTouched && name) {
      setSlug(generateSlug(name));
    }
  }, [name, slugTouched]);

  // Clear error when slug changes
  useEffect(() => {
    setSlugError(null);
  }, [slug]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);

  const handleSlugChange = (value: string) => {
    // Only allow lowercase letters, numbers, and hyphens
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlug(sanitized);
    setSlugTouched(true);
  };

  const handleGenerateRandomSlug = () => {
    setSlug(generateRandomSlug());
    setSlugTouched(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Use the same validity check as the submit button
    if (!name.trim() || !isSlugValid) {
      if (slug.length < 3) {
        setSlugError("Slug must be at least 3 characters");
      } else if (!isSlugFormatValid) {
        setSlugError(
          "Slug must start and end with a letter or number, and use single hyphens to separate words",
        );
      }
      // If it's an availability issue, error message is already shown in UI
      return;
    }

    createTeam({ name: name.trim(), slug });
  };

  // isSlugValid now requires format validation in addition to availability
  const isSlugValid = isSlugFormatValid && slugCheck?.available && !slugError;
  const isSlugInvalid =
    slug.length >= 3 &&
    (!isSlugFormatValid || slugCheck?.available === false || !!slugError);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Team</DialogTitle>
            <DialogDescription>
              Create a new team to organize your projects.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="team-name">Team name</Label>
              <Input
                id="team-name"
                placeholder="My Team"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="team-slug">
                Team URL
                <span className="text-muted-foreground ml-1 text-xs font-normal">
                  (cannot be changed later)
                </span>
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 text-sm">
                    /
                  </span>
                  <Input
                    id="team-slug"
                    placeholder="my-team"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    disabled={isPending}
                    className="pl-6 pr-8"
                  />
                  {slug.length >= 3 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isCheckingSlug ? (
                        <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                      ) : isSlugValid ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : isSlugInvalid ? (
                        <X className="h-4 w-4 text-red-500" />
                      ) : null}
                    </span>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleGenerateRandomSlug}
                  disabled={isPending}
                  title="Generate random slug"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              {slugError && (
                <p className="text-destructive text-sm">{slugError}</p>
              )}
              {!slugError &&
                isSlugFormatValid &&
                slugCheck?.available === false && (
                  <p className="text-destructive text-sm">
                    This slug is already taken
                  </p>
                )}
              {!slugError && slug.length > 0 && slug.length < 3 && (
                <p className="text-muted-foreground text-sm">
                  Slug must be at least 3 characters
                </p>
              )}
              {!slugError && slug.length >= 3 && !isSlugFormatValid && (
                <p className="text-destructive text-sm">
                  Slug must start and end with a letter or number, and use
                  single hyphens to separate words
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              loading={isPending}
              disabled={!name.trim() || !isSlugValid}
            >
              Create Team
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
