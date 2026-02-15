"use client";

import { generateRandomSlug, generateSlug } from "@/lib/slug";
import { api } from "@/trpc/react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { LoadingButton } from "@workspace/ui/components/loading-button";
import { Check, Loader2, RefreshCw, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type OnboardingFormProps = {
  readonly suggestedName?: string;
  readonly suggestedSlug?: string;
};

export function OnboardingForm({
  suggestedName = "",
  suggestedSlug = "",
}: OnboardingFormProps) {
  const router = useRouter();
  const [name, setName] = useState(suggestedName);
  const [slug, setSlug] = useState(
    suggestedSlug || (suggestedName ? generateSlug(suggestedName) : ""),
  );
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [debouncedSlug, setDebouncedSlug] = useState(slug);
  const utils = api.useUtils();

  // Validate slug format
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const isSlugFormatValid = slug.length >= 3 && slugRegex.test(slug);

  // Auto-generate slug from name if user hasn't manually edited it
  useEffect(() => {
    if (!slugTouched && name) {
      setSlug(generateSlug(name));
    }
  }, [name, slugTouched]);

  const handleGenerateRandomSlug = () => {
    setSlug(generateRandomSlug());
    setSlugTouched(true);
  };

  // Debounce slug for availability check
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSlug(slug);
    }, 300);
    return () => clearTimeout(timer);
  }, [slug]);

  // Check slug availability - only query when format is valid
  const { data: slugCheck, isFetching: isCheckingSlug } =
    api.team.checkSlugAvailable.useQuery(
      { slug: debouncedSlug },
      {
        enabled: isSlugFormatValid && debouncedSlug === slug,
        staleTime: 0,
      },
    );

  const { mutate: createPersonalTeam, isPending } =
    api.team.createPersonalTeam.useMutation({
      onSuccess: (team) => {
        utils.team.list.invalidate();
        if (team?.slug) {
          router.push(`/${team.slug}`);
        }
      },
      onError: (error) => {
        if (error.data?.code === "CONFLICT") {
          setSlugError("This slug is already taken");
        } else if (error.data?.code === "BAD_REQUEST") {
          setSlugError(error.message);
        } else {
          console.error("Failed to create personal team:", error);
          setSlugError("Something went wrong. Please try again.");
        }
      },
    });

  // Clear error when slug changes
  useEffect(() => {
    setSlugError(null);
  }, [slug]);

  const handleSlugChange = (value: string) => {
    // Only allow lowercase letters, numbers, and hyphens
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlug(sanitized);
    setSlugTouched(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    // Validate slug format
    if (!isSlugFormatValid) {
      if (slug.length < 3) {
        setSlugError("Slug must be at least 3 characters");
      } else {
        setSlugError("Slug must be lowercase letters, numbers, and hyphens only");
      }
      return;
    }

    if (slug.length > 50) {
      setSlugError("Slug must be at most 50 characters");
      return;
    }

    createPersonalTeam({ name: name.trim(), slug });
  };

  const isSlugValid =
    isSlugFormatValid &&
    slug === debouncedSlug &&
    slugCheck?.available &&
    !slugError;
  const isSlugInvalid =
    slug.length >= 3 &&
    slug === debouncedSlug &&
    (!isSlugFormatValid || slugCheck?.available === false || !!slugError);

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Team Name Input */}
        <div className="space-y-2">
          <Label htmlFor="team-name">Team Name</Label>
          <Input
            id="team-name"
            placeholder="My Personal Team"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isPending}
            autoFocus
          />
        </div>

        {/* Team URL Input */}
        <div className="space-y-2">
          <Label htmlFor="team-slug">Team URL</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm select-none">
                /
              </span>
              <Input
                id="team-slug"
                placeholder="my-personal-team"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                disabled={isPending}
                className="pr-10 pl-6"
              />
              {slug.length >= 3 && (
                <span className="absolute top-1/2 right-3 -translate-y-1/2">
                  {isCheckingSlug || slug !== debouncedSlug ? (
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
          {/* Fixed height container to prevent layout shift */}
          <p className="h-5 text-sm">
            {slugError ? (
              <span className="text-destructive">{slugError}</span>
            ) : !slugError &&
              slug.length >= 3 &&
              !slugRegex.test(slug) ? (
              <span className="text-destructive">
                Slug must start and end with a letter or number
              </span>
            ) : !slugError &&
              slug.length >= 3 &&
              slug === debouncedSlug &&
              slugCheck?.available === false ? (
              <span className="text-destructive">
                This URL is already taken
              </span>
            ) : !slugError && slug.length > 0 && slug.length < 3 ? (
              <span className="text-muted-foreground">
                Must be at least 3 characters
              </span>
            ) : isSlugValid ? (
              <span className="text-green-500">This URL is available</span>
            ) : null}
          </p>
        </div>

        <div className="py-2">
          <LoadingButton
            type="submit"
            className="w-full"
            loading={isPending}
            disabled={!name.trim() || !isSlugValid}
          >
            Continue
          </LoadingButton>
        </div>
      </form>

      <p className="text-muted-foreground mt-4 text-center text-xs">
        This will be your personal team. You can create additional teams later.
      </p>
    </>
  );
}
