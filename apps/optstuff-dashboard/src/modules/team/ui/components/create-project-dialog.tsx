"use client";

import { DOCS_LINKS } from "@/lib/constants";
import { api } from "@/trpc/react";
import { Button } from "@workspace/ui/components/button";
import { CopyButton } from "@workspace/ui/components/copy-button";
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
import { cn } from "@workspace/ui/lib/utils";
import { BookOpen, Eye, EyeOff, FolderOpen, Key, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type CreateProjectDialogProps = {
  readonly teamId: string;
  readonly teamSlug: string;
  readonly trigger?: React.ReactNode;
  /** When provided, the dialog is externally controlled. */
  readonly externalOpen?: boolean;
  /** Called when the dialog wants to change its open state (controlled mode). */
  readonly onExternalOpenChange?: (open: boolean) => void;
};

type CreatedProject = {
  readonly slug: string;
  readonly name: string;
  readonly defaultApiKey: string;
  readonly defaultSecretKey: string;
};

export function CreateProjectDialog({
  teamId,
  teamSlug,
  trigger,
  externalOpen,
  onExternalOpenChange,
}: CreateProjectDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = isControlled
    ? (value: boolean) => onExternalOpenChange?.(value)
    : setInternalOpen;
  const [step, setStep] = useState<"form" | "success">("form");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [createdProject, setCreatedProject] = useState<CreatedProject | null>(
    null,
  );
  const [showSecretKey, setShowSecretKey] = useState(false);

  const utils = api.useUtils();

  const {
    mutate: createProject,
    isPending,
    isError,
    error: mutationError,
    reset: resetMutation,
  } = api.project.create.useMutation({
    onSuccess: (project) => {
      utils.project.list.invalidate();
      utils.project.listAll.invalidate();

      if (project?.defaultApiKey && project?.defaultSecretKey) {
        setCreatedProject({
          slug: project.slug,
          name: project.name,
          defaultApiKey: project.defaultApiKey,
          defaultSecretKey: project.defaultSecretKey,
        });
        setStep("success");
      } else {
        // Fallback: if no key returned, navigate directly
        router.push(`/${teamSlug}/${project?.slug}`);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    resetMutation();
    createProject({
      teamId,
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  const handleDone = () => {
    const projectSlug = createdProject?.slug;
    setOpen(false);

    // Reset state after animation
    setTimeout(() => {
      setStep("form");
      setName("");
      setDescription("");
      setCreatedProject(null);
      setShowSecretKey(false);
    }, 150);

    if (projectSlug) {
      router.push(`/${teamSlug}/${projectSlug}`);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (isOpen) {
          setOpen(true);
        } else if (step === "form") {
          setOpen(false);
        }
        // Prevent closing on success step — user must click "Done"
      }}
    >
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger ?? <Button>New Project</Button>}
        </DialogTrigger>
      )}
      <DialogContent
        className={cn(
          "sm:max-w-[520px]",
          step === "success" && "max-h-[85vh] overflow-y-auto",
        )}
        hideCloseButton={step === "success"}
        onInteractOutside={(e) => {
          if (step === "success") e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (step === "success") e.preventDefault();
        }}
      >
        {step === "form" ? (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
              <DialogDescription>
                Create a new project to start optimizing images. A default API
                key will be generated automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  placeholder="My Awesome Project"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isPending}
                  autoFocus
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="projectDescription">
                  Description{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="projectDescription"
                  placeholder="A brief description of your project"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isPending}
                />
              </div>
            </div>
            {isError && (
              <p className="text-destructive text-sm" role="alert">
                {mutationError?.message ?? "Failed to create project. Please try again."}
              </p>
            )}
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
                disabled={!name.trim()}
              >
                Create Project
              </LoadingButton>
            </DialogFooter>
          </form>
        ) : (
          <div className="flex flex-col">
            {/* Success Header */}
            <div className="flex items-center gap-3 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                <FolderOpen className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <DialogTitle className="text-lg">Project Created</DialogTitle>
                <DialogDescription className="mt-0.5 text-sm">
                  <strong>{createdProject?.name}</strong> is ready with a
                  default API key
                </DialogDescription>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
              {/* Warning banner */}
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm font-medium text-amber-700 dark:text-amber-400">
                <Shield className="h-4 w-4 shrink-0" />
                <span>
                  Secret key is only shown once. Copy and save it before
                  closing.
                </span>
              </div>

              {/* Secret Key Display */}
              <div className="space-y-2">
                <Label className="text-muted-foreground flex items-center gap-1.5 text-xs tracking-wider uppercase">
                  <Key className="h-3 w-3" />
                  Secret Key (for signing URLs)
                </Label>
                <div className="bg-muted/50 border-border group relative rounded-lg border p-3">
                  <code className="block pr-16 font-mono text-sm break-all">
                    {showSecretKey
                      ? createdProject?.defaultSecretKey
                      : "•".repeat(
                          createdProject?.defaultSecretKey?.length ?? 0,
                        )}
                  </code>
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowSecretKey((prev) => !prev)}
                      className="text-muted-foreground hover:text-foreground flex h-8 w-8 items-center justify-center rounded-md transition-colors"
                      aria-label={
                        showSecretKey ? "Hide secret key" : "Show secret key"
                      }
                      tabIndex={0}
                    >
                      {showSecretKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    <CopyButton
                      text={createdProject?.defaultSecretKey ?? ""}
                      className="h-8 w-8 rounded-md bg-secondary shadow-sm"
                    />
                  </div>
                </div>
                <p className="text-muted-foreground text-xs">
                  Use this secret in your backend to sign image URLs. Never
                  expose it in frontend code.
                </p>
              </div>

              {/* Public Key Display */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs tracking-wider uppercase">
                  Public Key (for URL parameter)
                </Label>
                <div className="bg-muted/50 border-border group relative rounded-lg border p-3">
                  <code className="block pr-10 font-mono text-sm">
                    {createdProject?.defaultApiKey}
                  </code>
                  <div className="absolute top-2 right-2">
                    <CopyButton
                      text={createdProject?.defaultApiKey ?? ""}
                      className="h-8 w-8 rounded-md bg-secondary shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                <p className="mb-2 text-sm font-medium">Next Steps</p>
                <p className="text-muted-foreground text-sm">
                  Learn how to sign URLs and integrate OptStuff into your
                  application.
                </p>
                <a
                  href={DOCS_LINKS.integration}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Read Integration Guide
                </a>
              </div>
            </div>

            {/* Footer */}
            <DialogFooter className="mt-6">
              <Button onClick={handleDone} className="w-full sm:w-auto">
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
