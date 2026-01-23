"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { api } from "@/trpc/react";
import { generateSlug, generateRandomSlug } from "@/lib/slug";

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

  // Check slug availability
  const { data: slugCheck, isFetching: isCheckingSlug } =
    api.team.checkSlugAvailable.useQuery(
      { slug },
      {
        enabled: slug.length >= 3,
        staleTime: 0,
      },
    );

  const { mutate: createTeam, isPending } = api.team.create.useMutation({
    onSuccess: (team) => {
      utils.team.list.invalidate();
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

    // Validate slug format
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setSlugError("Slug must be lowercase letters, numbers, and hyphens only");
      return;
    }

    if (slug.length < 3) {
      setSlugError("Slug must be at least 3 characters");
      return;
    }

    if (name.trim() && slug) {
      createTeam({ name: name.trim(), slug });
    }
  };

  const isSlugValid = slug.length >= 3 && slugCheck?.available && !slugError;
  const isSlugInvalid =
    slug.length >= 3 && (slugCheck?.available === false || slugError);

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
                  <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">
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
                    <span className="absolute top-1/2 right-3 -translate-y-1/2">
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
              {!slugError && slug.length >= 3 && slugCheck?.available === false && (
                <p className="text-destructive text-sm">
                  This slug is already taken
                </p>
              )}
              {!slugError && slug.length > 0 && slug.length < 3 && (
                <p className="text-muted-foreground text-sm">
                  Slug must be at least 3 characters
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
            <Button
              type="submit"
              disabled={isPending || !name.trim() || !isSlugValid}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Team
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
