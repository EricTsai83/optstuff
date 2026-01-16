"use client";

import { useState } from "react";
import { Loader2, Check, Shield, Copy } from "lucide-react";
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
  readonly trigger?: React.ReactNode;
};

export function CreateApiKeyDialog({
  projectId,
  trigger,
}: CreateApiKeyDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const utils = api.useUtils();

  const { mutate: createApiKey, isPending } = api.apiKey.create.useMutation({
    onSuccess: (result) => {
      if (result?.key) {
        setCreatedKey(result.key);
        utils.apiKey.list.invalidate();
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createApiKey({ projectId, name: name.trim() });
  };

  const handleClose = () => {
    setOpen(false);
    setName("");
    setCreatedKey(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
        else setOpen(true);
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? <Button>Create API Key</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        {!createdKey ? (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Generate a new API key to access the image optimization service.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="keyName">Key Name</Label>
                <Input
                  id="keyName"
                  placeholder="Production Key"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isPending}
                  autoFocus
                />
                <p className="text-muted-foreground text-xs">
                  A descriptive name to help you identify this key later.
                </p>
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
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Key
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="flex flex-col">
            {/* Success Header */}
            <div className="flex items-center gap-3 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <DialogTitle className="text-lg">API Key Created</DialogTitle>
                <DialogDescription className="mt-0.5 text-sm">
                  Copy and save your key securely
                </DialogDescription>
              </div>
            </div>

            {/* Content with fixed height */}
            <div className="space-y-4">
              {/* API Key Display */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                    Your API Key
                  </Label>
                  <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                    <Shield className="h-3 w-3" />
                    <span>Only shown once</span>
                  </div>
                </div>
                <div className="bg-muted/50 border-border group relative rounded-lg border p-3">
                  <code className="block break-all pr-10 font-mono text-sm">
                    {createdKey}
                  </code>
                  <div className="absolute top-2 right-2">
                    <CopyButton
                      text={createdKey}
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Code Examples */}
              <ApiCodeExamples apiKey={createdKey} />

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
