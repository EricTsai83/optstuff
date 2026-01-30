"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Label } from "@workspace/ui/components/label";
import { Key, RotateCcw, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import type { EditingKeyData, RotatedKeyData } from "./api-key-types";
import { CopyButton } from "@workspace/ui/components/copy-button";
import { DomainListInput } from "./domain-list-input";
import { ExpirationSelect } from "./expiration-select";

// ============================================================================
// Types
// ============================================================================

type RotatedKeyDialogProps = {
  readonly rotatedKey: RotatedKeyData | null;
  readonly onClose: () => void;
};

type EditApiKeyDialogProps = {
  readonly editingKey: EditingKeyData | null;
  readonly onClose: () => void;
  readonly onSave: (domains: string[], expiresAt: Date | null) => void;
  readonly isUpdating: boolean;
};

// ============================================================================
// Rotated Key Dialog
// ============================================================================

export function RotatedKeyDialog({ rotatedKey, onClose }: RotatedKeyDialogProps) {
  return (
    <Dialog open={!!rotatedKey} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <div className="flex flex-col">
          {/* Success Header */}
          <div className="flex items-center gap-3 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
              <RotateCcw className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <DialogTitle className="text-lg">API Key Rotated</DialogTitle>
              <DialogDescription className="mt-0.5 text-sm">
                <strong>{rotatedKey?.name}</strong> has been rotated
              </DialogDescription>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4">
            {/* Secret Key Display */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                  <Key className="h-3 w-3" />
                  New Secret Key (for signing URLs)
                </Label>
                <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                  <Shield className="h-3 w-3" />
                  <span>Only shown once</span>
                </div>
              </div>
              <div className="group relative rounded-lg border border-border bg-muted/50 p-3">
                <code className="block break-all pr-10 font-mono text-sm">
                  {rotatedKey?.secretKey}
                </code>
                <div className="absolute right-2 top-2">
                  <CopyButton
                    text={rotatedKey?.secretKey ?? ""}
                    className="h-8 w-8 rounded-md bg-secondary shadow-sm"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                The old key is now invalid. Update your backend with this new
                secret key.
              </p>
            </div>

            {/* Key Prefix Display */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                New Key Prefix (for URL parameter)
              </Label>
              <div className="group relative rounded-lg border border-border bg-muted/50 p-3">
                <code className="block pr-10 font-mono text-sm">
                  {rotatedKey?.key.substring(0, 12)}
                </code>
                <div className="absolute right-2 top-2">
                  <CopyButton
                    text={rotatedKey?.key.substring(0, 12) ?? ""}
                    className="h-8 w-8 rounded-md bg-secondary shadow-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="mt-6">
            <Button onClick={onClose} className="w-full sm:w-auto">
              Done
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Edit API Key Dialog
// ============================================================================

export function EditApiKeyDialog({
  editingKey,
  onClose,
  onSave,
  isUpdating,
}: EditApiKeyDialogProps) {
  const [domains, setDomains] = useState<string[]>([]);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  // Initialize domains and expiresAt when editingKey changes
  useEffect(() => {
    if (editingKey) {
      setDomains(editingKey.allowedSourceDomains ?? []);
      setExpiresAt(editingKey.expiresAt);
    }
  }, [editingKey]);

  const handleOpenChange = (open: boolean): void => {
    if (!open) {
      onClose();
    }
  };

  const handleSave = (): void => {
    onSave(domains, expiresAt);
  };

  return (
    <Dialog open={!!editingKey} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Edit API Key</DialogTitle>
          <DialogDescription>
            Update the settings for <strong>{editingKey?.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-3">
            <Label>Allowed Source Domains</Label>
            <p className="text-sm text-muted-foreground">
              Which image sources can this key access? Subdomains are
              automatically included.
            </p>
            <DomainListInput
              value={domains}
              onChange={setDomains}
              placeholder="images.example.com"
              disabled={isUpdating}
            />
          </div>

          <ExpirationSelect
            value={expiresAt ?? undefined}
            onChange={(date) => setExpiresAt(date ?? null)}
            disabled={isUpdating}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUpdating}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
