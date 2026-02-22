"use client";

import { env } from "@/env";
import { DOCS_LINKS } from "@/lib/constants";
import { DomainListInput } from "@/modules/project-detail/ui/components/domain-list-input";
import { api } from "@/trpc/react";
import { Button } from "@workspace/ui/components/button";
import { CodeBlock } from "@workspace/ui/components/code-block";
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
import { BookOpen, Check, FolderPlus, Info, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

type Step = "form" | "success";

type CreatedProject = {
  readonly slug: string;
  readonly name: string;
  readonly defaultApiKey: string;
  readonly defaultSecretKey: string;
};

type CreateProjectDialogProps = {
  readonly teamId: string;
  readonly teamSlug: string;
  readonly trigger?: React.ReactNode;
  /** When provided, the dialog is externally controlled. */
  readonly externalOpen?: boolean;
  /** Called when the dialog wants to change its open state (controlled mode). */
  readonly onExternalOpenChange?: (open: boolean) => void;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

function useCreateProjectForm({
  teamId,
  teamSlug,
  onCreated,
}: {
  teamId: string;
  teamSlug: string;
  onCreated: (project: CreatedProject) => void;
}) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [allowedRefererDomains, setAllowedRefererDomains] = useState<string[]>(
    [],
  );

  const utils = api.useUtils();
  const {
    mutate: createProject,
    isPending,
    isError,
    error: mutationError,
    reset: resetMutation,
  } = api.project.create.useMutation({
    onSuccess: (project) => {
      void utils.project.list.invalidate();
      void utils.project.listAll.invalidate();

      if (project?.defaultApiKey && project?.defaultSecretKey) {
        onCreated({
          slug: project.slug,
          name: project.name,
          defaultApiKey: project.defaultApiKey,
          defaultSecretKey: project.defaultSecretKey,
        });
      } else {
        router.push(`/${teamSlug}/${project?.slug}`);
      }
    },
  });

  const resetForm = useCallback(() => {
    setName("");
    setDescription("");
    setAllowedRefererDomains([]);
    resetMutation();
  }, [resetMutation]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return;

      resetMutation();
      createProject({
        teamId,
        name: name.trim(),
        description: description.trim() || undefined,
        allowedRefererDomains:
          allowedRefererDomains.length > 0 ? allowedRefererDomains : undefined,
      });
    },
    [
      name,
      description,
      allowedRefererDomains,
      teamId,
      resetMutation,
      createProject,
    ],
  );

  return {
    form: {
      name,
      setName,
      description,
      setDescription,
      allowedRefererDomains,
      setAllowedRefererDomains,
    },
    canSubmit: !!name.trim(),
    isPending,
    isError,
    mutationError,
    handleSubmit,
    resetForm,
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CreateProjectFormStep({
  form,
  canSubmit,
  isPending,
  isError,
  mutationError,
  onSubmit,
  onCancel,
}: {
  form: ReturnType<typeof useCreateProjectForm>["form"];
  canSubmit: boolean;
  isPending: boolean;
  isError: boolean;
  mutationError: { message?: string } | null;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSubmit}>
      <div className="from-primary/6 via-primary/2 to-background border-b bg-linear-to-b px-6 pb-5 pt-6">
        <DialogHeader className="space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
              <FolderPlus className="text-primary h-5 w-5" />
            </div>
            <DialogTitle className="text-xl font-semibold tracking-tight">
              Create Project
            </DialogTitle>
          </div>
          <DialogDescription className="text-[15px] leading-relaxed">
            Create a new project to start optimizing images. A default API key
            will be generated automatically.
          </DialogDescription>
        </DialogHeader>
      </div>

      <div className="grid gap-5 px-6 py-6">
        <div className="grid gap-2">
          <Label htmlFor="projectName" className="text-[15px]">
            Project Name
          </Label>
          <Input
            id="projectName"
            placeholder="My Awesome Project"
            value={form.name}
            onChange={(e) => form.setName(e.target.value)}
            disabled={isPending}
            autoFocus
            className="h-11 text-[15px]"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="projectDescription" className="text-[15px]">
            Description{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </Label>
          <Input
            id="projectDescription"
            placeholder="A brief description of your project"
            value={form.description}
            onChange={(e) => form.setDescription(e.target.value)}
            disabled={isPending}
            className="h-11 text-[15px]"
          />
        </div>
        <div className="grid gap-2">
          <Label className="text-[15px]">
            Allowed Referer Domains{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </Label>
          <p className="text-muted-foreground text-[14px] leading-relaxed">
            Define which websites can use your image optimization service. You
            can also configure this later in Settings.
          </p>
          <DomainListInput
            value={form.allowedRefererDomains}
            onChange={form.setAllowedRefererDomains}
            placeholder="https://example.com"
            disabled={isPending}
          />
        </div>
      </div>

      {isError && (
        <p className="text-destructive px-6 pb-2 text-[14px]" role="alert">
          {mutationError?.message ??
            "Failed to create project. Please try again."}
        </p>
      )}

      <DialogFooter className="border-t px-6 py-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
          className="h-10 px-5 text-[14px]"
        >
          Cancel
        </Button>
        <LoadingButton
          type="submit"
          loading={isPending}
          disabled={!canSubmit}
          className="h-10 px-5 text-[14px]"
        >
          Create Project
        </LoadingButton>
      </DialogFooter>
    </form>
  );
}

function ProjectCreatedStep({
  project,
  onDone,
}: {
  project: CreatedProject;
  onDone: () => void;
}) {
  const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");

  return (
    <div className="flex min-w-0 flex-col">
      <div className="from-green-500/6 via-green-500/2 to-background border-b bg-linear-to-b px-6 pb-5 pt-6">
        <DialogHeader className="space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/15">
              <Check className="h-5 w-5 text-green-500" strokeWidth={3} />
            </div>
            <DialogTitle className="text-xl font-semibold tracking-tight">
              Project Created
            </DialogTitle>
          </div>
          <DialogDescription className="text-[15px] leading-relaxed">
            Copy these environment variables to your{" "}
            <code className="text-foreground/70 font-medium">.env</code> file.
            The secret key won&apos;t be shown again.
          </DialogDescription>
        </DialogHeader>
      </div>

      <div className="space-y-4 px-6 py-5">
        <CodeBlock
          content={`OPTSTUFF_BASE_URL="${baseUrl}"\nOPTSTUFF_PROJECT_SLUG="${project.slug}"\nOPTSTUFF_SECRET_KEY="${"•".repeat(project.defaultSecretKey.length)}"\nOPTSTUFF_PUBLIC_KEY="${project.defaultApiKey}"`}
          copyText={`OPTSTUFF_BASE_URL="${baseUrl}"\nOPTSTUFF_PROJECT_SLUG="${project.slug}"\nOPTSTUFF_SECRET_KEY="${project.defaultSecretKey}"\nOPTSTUFF_PUBLIC_KEY="${project.defaultApiKey}"`}
          variant="block"
          nowrap
        />
        <p className="text-[14px] font-medium text-amber-600 dark:text-amber-400">
          <Shield className="mb-0.5 mr-1.5 inline h-4 w-4" />
          Secret key is server-side only — never expose it in frontend code.
        </p>
      </div>

      <div className="mx-6 flex items-start gap-2.5 rounded-lg border px-3.5 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
        <p className="text-muted-foreground text-[14px] leading-relaxed">
          For local development, add{" "}
          <code className="bg-muted rounded px-1.5 py-0.5 font-medium">
            http://localhost
          </code>{" "}
          to Allowed Referer Domains in Settings.
        </p>
      </div>

      <DialogFooter className="mt-4 flex-row items-center gap-3 border-t px-6 py-4 sm:justify-between">
        <a
          href={DOCS_LINKS.integration}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-[14px] transition-colors"
        >
          <BookOpen className="h-4 w-4" />
          Integration Guide
        </a>
        <Button onClick={onDone} className="h-10 px-5 text-[14px]">
          Go to Project
        </Button>
      </DialogFooter>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

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

  const [step, setStep] = useState<Step>("form");
  const [createdProject, setCreatedProject] = useState<CreatedProject | null>(
    null,
  );

  const {
    form,
    canSubmit,
    isPending,
    isError,
    mutationError,
    handleSubmit,
    resetForm,
  } = useCreateProjectForm({
    teamId,
    teamSlug,
    onCreated: (project) => {
      setCreatedProject(project);
      setStep("success");
    },
  });

  const handleDone = () => {
    const projectSlug = createdProject?.slug;
    setOpen(false);
    setTimeout(() => {
      setStep("form");
      setCreatedProject(null);
      resetForm();
      if (projectSlug) {
        router.push(`/${teamSlug}/${projectSlug}`);
      }
    }, 350);
  };

  const isSuccess = step === "success";

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (isOpen) {
          setOpen(true);
        } else if (!isSuccess) {
          setOpen(false);
        }
      }}
    >
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger ?? <Button>New Project</Button>}
        </DialogTrigger>
      )}

      <DialogContent
        className={cn(
          "gap-0 overflow-hidden p-0 transition-[max-width] duration-350 ease-out",
          isSuccess && "max-h-[85vh] overflow-y-auto",
        )}
        style={{ maxWidth: isSuccess ? 680 : 560 }}
        hideCloseButton={isSuccess}
        onInteractOutside={(e) => {
          if (isSuccess) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isSuccess) e.preventDefault();
        }}
      >
        <div
          key={step}
          className={cn(
            "animate-in fade-in-0 duration-300",
            isSuccess && "[animation-delay:350ms] fill-mode-[backwards]",
          )}
        >
          {step === "form" ? (
            <CreateProjectFormStep
              form={form}
              canSubmit={canSubmit}
              isPending={isPending}
              isError={isError}
              mutationError={mutationError}
              onSubmit={handleSubmit}
              onCancel={() => setOpen(false)}
            />
          ) : createdProject ? (
            <ProjectCreatedStep project={createdProject} onDone={handleDone} />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
