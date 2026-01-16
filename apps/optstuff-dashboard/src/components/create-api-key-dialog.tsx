"use client";

import { useState } from "react";
import { Loader2, Copy, Check, AlertTriangle } from "lucide-react";
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
import { Card, CardContent } from "@workspace/ui/components/card";
import { api } from "@/trpc/react";
import { copyToClipboard } from "@/lib/clipboard";
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
  const [keyCopied, setKeyCopied] = useState(false);

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

    createApiKey({
      projectId,
      name: name.trim(),
    });
  };

  const handleCopyKey = async () => {
    if (!createdKey) return;
    await copyToClipboard(createdKey);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000);
  };

  const handleClose = () => {
    setOpen(false);
    setName("");
    setCreatedKey(null);
    setKeyCopied(false);
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
      <DialogContent className="sm:max-w-[500px]">
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
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                API Key Created
              </DialogTitle>
              <DialogDescription>
                Your new API key has been created. Make sure to copy it now -
                you won&apos;t be able to see it again!
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] space-y-4 overflow-y-auto py-4">
              <Card className="border-amber-500/50 bg-amber-500/10">
                <CardContent className="flex items-start gap-3 pt-4">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-600 dark:text-amber-400">
                      Save this key securely
                    </p>
                    <p className="text-muted-foreground mt-1">
                      This is the only time you&apos;ll see the full API key.
                      Store it in a secure location like a password manager or
                      environment variable.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div>
                <Label className="text-muted-foreground text-xs">
                  Your API Key
                </Label>
                <div className="mt-1.5 flex items-center gap-2">
                  <code className="bg-muted flex-1 rounded-md px-3 py-2 font-mono text-sm break-all">
                    {createdKey}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopyKey}
                    className="shrink-0"
                  >
                    {keyCopied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Usage Examples */}
              <ApiCodeExamples apiKey={createdKey} />

              {/* Documentation Link */}
              <DocsLink />
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
