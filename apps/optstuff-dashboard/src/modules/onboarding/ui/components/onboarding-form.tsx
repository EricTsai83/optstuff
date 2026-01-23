"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, X, Shuffle } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { api } from "@/trpc/react";

// Word lists for generating friendly random slugs
const ADJECTIVES = [
  "swift",
  "bright",
  "calm",
  "clever",
  "bold",
  "gentle",
  "happy",
  "keen",
  "lucky",
  "neat",
  "quick",
  "smart",
  "warm",
  "wise",
  "cool",
  "fresh",
  "kind",
  "pure",
  "safe",
  "true",
];

const NOUNS = [
  "fox",
  "owl",
  "wolf",
  "bear",
  "hawk",
  "deer",
  "hare",
  "lynx",
  "seal",
  "crow",
  "dove",
  "frog",
  "moth",
  "swan",
  "toad",
  "wren",
  "crab",
  "duck",
  "fish",
  "goat",
];

function generateRandomSlug(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adjective}-${noun}-personal-team`;
}

type OnboardingFormProps = {
  readonly suggestedSlug: string;
};

export function OnboardingForm({ suggestedSlug }: OnboardingFormProps) {
  const router = useRouter();
  // If no suggested slug, generate a random one
  const [slug, setSlug] = useState(() =>
    suggestedSlug || generateRandomSlug()
  );
  const [slugError, setSlugError] = useState<string | null>(null);
  const [debouncedSlug, setDebouncedSlug] = useState(slug);
  const utils = api.useUtils();

  const handleGenerateRandom = useCallback(() => {
    const newSlug = generateRandomSlug();
    setSlug(newSlug);
  }, []);

  // Debounce slug for availability check
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSlug(slug);
    }, 300);
    return () => clearTimeout(timer);
  }, [slug]);

  // Check slug availability
  const { data: slugCheck, isFetching: isCheckingSlug } =
    api.team.checkSlugAvailable.useQuery(
      { slug: debouncedSlug },
      {
        enabled: debouncedSlug.length >= 3,
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate slug format
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setSlugError(
        "Slug must be lowercase letters, numbers, and hyphens only (cannot start or end with hyphen)",
      );
      return;
    }

    if (slug.length < 3) {
      setSlugError("Slug must be at least 3 characters");
      return;
    }

    if (slug.length > 50) {
      setSlugError("Slug must be at most 50 characters");
      return;
    }

    createPersonalTeam({ slug });
  };

  const isSlugValid =
    slug.length >= 3 &&
    slug === debouncedSlug &&
    slugCheck?.available &&
    !slugError;
  const isSlugInvalid =
    slug.length >= 3 &&
    slug === debouncedSlug &&
    (slugCheck?.available === false || slugError);

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="team-slug">Team URL</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground h-auto px-2 py-1 text-xs"
              onClick={handleGenerateRandom}
              disabled={isPending}
            >
              <Shuffle className="mr-1 h-3 w-3" />
              Random
            </Button>
          </div>
          <div className="relative">
            <span className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none text-sm">
              optstuff.com/
            </span>
            <Input
              id="team-slug"
              placeholder="your-team"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              disabled={isPending}
              className="pl-[104px] pr-10"
              autoFocus
            />
            {slug.length >= 3 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
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
          {/* Fixed height container to prevent layout shift */}
          <p className="h-5 text-sm">
            {slugError ? (
              <span className="text-destructive">{slugError}</span>
            ) : !slugError &&
              slug.length >= 3 &&
              slug === debouncedSlug &&
              slugCheck?.available === false ? (
              <span className="text-destructive">This URL is already taken</span>
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
          <Button
            type="submit"
            className="w-full"
            disabled={isPending || !isSlugValid}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </div>

      </form>

      <p className="text-muted-foreground mt-4 text-center text-xs">
        This will be your personal team. You can create additional teams later.
      </p>
    </>
  );
}
