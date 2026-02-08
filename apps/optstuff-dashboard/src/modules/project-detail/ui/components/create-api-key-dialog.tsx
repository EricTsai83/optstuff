"use client";

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
import { Key, Plus, Shield } from "lucide-react";
import { useState } from "react";
import { DomainListInput } from "./domain-list-input";
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
  const [sourceDomains, setSourceDomains] = useState<string[]>([]);
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined);
  const [createdPublicKey, setCreatedPublicKey] = useState<string | null>(null);
  const [createdSecretKey, setCreatedSecretKey] = useState<string | null>(null);

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
      allowedSourceDomains: sourceDomains,
      expiresAt: expiresAt,
    });
  };

  const handleClose = () => {
    setOpen(false);
    // Reset state after animation
    setTimeout(() => {
      setStep("form");
      setName("");
      setSourceDomains([]);
      setExpiresAt(undefined);
      setCreatedPublicKey(null);
      setCreatedSecretKey(null);
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
                Create a new API key with specific source domain permissions.
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

              <div className="grid gap-2">
                <Label>Allowed Source Domains</Label>
                <p className="text-muted-foreground text-xs">
                  Which image sources can this key access? Subdomains are
                  automatically included.
                </p>
                <DomainListInput
                  value={sourceDomains}
                  onChange={setSourceDomains}
                  placeholder="images.example.com"
                  disabled={isPending}
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
                disabled={isPending || !name.trim() || sourceDomains.length === 0}
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
                <Label className="text-muted-foreground flex items-center gap-1.5 text-xs tracking-wider uppercase">
                  <Key className="h-3 w-3" />
                  Secret Key (for signing URLs)
                </Label>
                <div className="bg-muted/50 border-border group relative rounded-lg border p-3">
                  <code className="block pr-10 font-mono text-sm break-all">
                    {createdSecretKey}
                  </code>
                  <div className="absolute top-2 right-2">
                    <CopyButton
                      text={createdSecretKey ?? ""}
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
                    {createdPublicKey}
                  </code>
                  <div className="absolute top-2 right-2">
                    <CopyButton
                      text={createdPublicKey ?? ""}
                      className="h-8 w-8 rounded-md bg-secondary shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Usage Example */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs tracking-wider uppercase">
                  Example Usage (Backend)
                </Label>
                <div className="bg-muted/50 border-border overflow-x-auto rounded-lg border p-3">
                  <pre className="font-mono text-xs">
                    {`import crypto from 'crypto';

const secretKey = '${createdSecretKey}';
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
