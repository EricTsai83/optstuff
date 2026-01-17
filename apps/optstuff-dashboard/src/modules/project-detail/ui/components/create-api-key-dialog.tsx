"use client";

import { useState } from "react";
import { Plus, Shield } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { api } from "@/trpc/react";
import { CopyButton } from "./copy-button";
import { ApiCodeExamples, DocsLink } from "./api-code-examples";

type CreateApiKeyDialogProps = {
  readonly projectId: string;
};

export function CreateApiKeyDialog({ projectId }: CreateApiKeyDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"form" | "success">("form");
  const [name, setName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const utils = api.useUtils();

  const { mutate: createKey, isPending } = api.apiKey.create.useMutation({
    onSuccess: (result) => {
      utils.apiKey.list.invalidate();
      if (result?.key) {
        setCreatedKey(result.key);
        setStep("success");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createKey({ projectId, name: name.trim() });
  };

  const handleClose = () => {
    setOpen(false);
    // Reset state after animation
    setTimeout(() => {
      setStep("form");
      setName("");
      setCreatedKey(null);
    }, 150);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => (isOpen ? setOpen(true) : handleClose())}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Create API Key
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        {step === "form" ? (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Create a new API key for this project. Give it a descriptive
                name.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="keyName">Key Name</Label>
                <Input
                  id="keyName"
                  placeholder="e.g., Production, Development, CI/CD"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isPending}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !name.trim()}>
                Create Key
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="flex flex-col">
            {/* Success Header */}
            <div className="flex items-center gap-3 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                <Shield className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <DialogTitle className="text-lg">API Key Created</DialogTitle>
                <DialogDescription className="mt-0.5 text-sm">
                  Your new API key <strong>{name}</strong> is ready
                </DialogDescription>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
              {/* API Key Display */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground text-xs tracking-wider uppercase">
                    Your API Key
                  </Label>
                  <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                    <Shield className="h-3 w-3" />
                    <span>Only shown once</span>
                  </div>
                </div>
                <div className="bg-muted/50 border-border group relative rounded-lg border p-3">
                  <code className="block pr-10 font-mono text-sm break-all">
                    {createdKey}
                  </code>
                  <div className="absolute top-2 right-2">
                    <CopyButton
                      text={createdKey ?? ""}
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 shadow-sm"
                    />
                  </div>
                </div>
                <p className="text-muted-foreground text-xs">
                  Copy this key now. You won&apos;t be able to see it again.
                </p>
              </div>

              {/* Code Examples */}
              {createdKey && <ApiCodeExamples apiKey={createdKey} />}

              {/* Docs Link */}
              <DocsLink />
            </div>

            {/* Footer */}
            <DialogFooter className="mt-6">
              <Button onClick={handleClose} className="w-full sm:w-auto">
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
