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
import { cn } from "@workspace/ui/lib/utils";
import { Eye, EyeOff, Key, Plus, Shield } from "lucide-react";
import { useState } from "react";
import { ExpirationSelect } from "./expiration-select";

type CreateApiKeyDialogProps = {
  readonly projectId: string;
  readonly projectSlug: string;
};

export function CreateApiKeyDialog({
  projectId,
  projectSlug,
}: CreateApiKeyDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"form" | "success">("form");
  const [name, setName] = useState("");
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined);
  const [createdPublicKey, setCreatedPublicKey] = useState<string | null>(null);
  const [createdSecretKey, setCreatedSecretKey] = useState<string | null>(null);
  const [showSecretKey, setShowSecretKey] = useState(false);

  const utils = api.useUtils();

  const { mutate: createKey, isPending } = api.apiKey.create.useMutation({
    onSuccess: (result) => {
      utils.apiKey.list.invalidate();
      if (result?.publicKey && result?.secretKey) {
        setCreatedPublicKey(result.publicKey);
        setCreatedSecretKey(result.secretKey);
        setStep("success");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createKey({
      projectId,
      name: name.trim(),
      expiresAt: expiresAt,
    });
  };

  const handleClose = () => {
    setOpen(false);
    // Reset state after animation
    setTimeout(() => {
      setStep("form");
      setName("");
      setExpiresAt(undefined);
      setCreatedPublicKey(null);
      setCreatedSecretKey(null);
      setShowSecretKey(false);
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
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Create a new API key for this project. Image source
                restrictions are managed in project Settings.
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

              <ExpirationSelect
                value={expiresAt}
                onChange={setExpiresAt}
                disabled={isPending}
              />
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
              <Button
                type="submit"
                disabled={isPending || !name.trim()}
              >
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
              {/* Prominent warning banner */}
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm font-medium text-amber-700 dark:text-amber-400">
                <Shield className="h-4 w-4 shrink-0" />
                <span>
                  Secret key is only shown once. Copy and save it before
                  closing.
                </span>
              </div>
              {/* Secret Key Display */}
              <div className="space-y-2">
                <Label className="text-muted-foreground flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <Key className="h-3 w-3" />
                  Secret Key (for signing URLs)
                </Label>
                <div className="bg-muted/50 border-border group relative rounded-lg border p-3">
                  <code className="block break-all pr-16 font-mono text-sm">
                    {showSecretKey
                      ? createdSecretKey
                      : "•".repeat(createdSecretKey?.length ?? 0)}
                  </code>
                  <div className="absolute right-2 top-2 flex items-center gap-1">
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
                      text={createdSecretKey ?? ""}
                      className="bg-secondary h-8 w-8 rounded-md shadow-sm"
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
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                  Public Key (for URL parameter)
                </Label>
                <div className="bg-muted/50 border-border group relative rounded-lg border p-3">
                  <code className="block pr-10 font-mono text-sm">
                    {createdPublicKey}
                  </code>
                  <div className="absolute right-2 top-2">
                    <CopyButton
                      text={createdPublicKey ?? ""}
                      className="bg-secondary h-8 w-8 rounded-md shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Usage Example */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                  Example Usage (Backend)
                </Label>
                <div className="bg-muted/50 border-border overflow-x-auto rounded-lg border p-3">
                  <pre className="font-mono text-xs">
                    {`import crypto from 'crypto';

const secretKey = '${showSecretKey ? createdSecretKey : "•".repeat(createdSecretKey?.length ?? 0)}';
const publicKey = '${createdPublicKey}';

function signUrl(operations, imageUrl) {
  const path = \`\${operations}/\${imageUrl}\`;
  const sig = crypto
    .createHmac('sha256', secretKey)
    .update(path)
    .digest('base64url')
    .substring(0, 32);
  
  return \`/api/v1/${projectSlug}/\${path}?key=\${publicKey}&sig=\${sig}\`;
}

// Example:
const url = signUrl('w_800,f_webp', 'images.example.com/photo.jpg');`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Footer */}
            <DialogFooter className="mt-6 flex-col gap-2 sm:flex-row">
              <Button variant="outline" asChild>
                <a
                  href={DOCS_LINKS.integration}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Read Integration Guide
                </a>
              </Button>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
