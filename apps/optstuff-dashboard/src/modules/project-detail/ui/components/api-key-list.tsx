"use client";

import { api } from "@/trpc/react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Label } from "@workspace/ui/components/label";
import { differenceInDays, format, formatDistanceToNow } from "date-fns";
import { AlertTriangle, Clock, Globe, Key, MoreHorizontal, Pencil, RotateCcw, Shield, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { CopyButton, CopyIcon } from "./copy-button";
import { CreateApiKeyDialog } from "./create-api-key-dialog";
import { DomainListInput } from "./domain-list-input";
import { ExpirationSelect } from "./expiration-select";

type ApiKeyListProps = {
  readonly projectId: string;
  readonly projectSlug: string;
};

export function ApiKeyList({ projectId, projectSlug }: ApiKeyListProps) {
  const { data: apiKeys, isLoading } = api.apiKey.list.useQuery({ projectId });
  const [rotatedKey, setRotatedKey] = useState<{
    key: string;
    secretKey: string;
    name: string;
  } | null>(null);
  const [editingKey, setEditingKey] = useState<{
    id: string;
    name: string;
    allowedSourceDomains: string[] | null;
    expiresAt: Date | null;
  } | null>(null);
  const utils = api.useUtils();

  const { mutate: revokeKey, isPending: isRevoking } =
    api.apiKey.revoke.useMutation({
      onSuccess: () => utils.apiKey.list.invalidate(),
    });

  const { mutate: rotateKey, isPending: isRotating } =
    api.apiKey.rotate.useMutation({
      onSuccess: (result) => {
        utils.apiKey.list.invalidate();
        if (result?.key && result?.secretKey && result?.name) {
          setRotatedKey({
            key: result.key,
            secretKey: result.secretKey,
            name: result.name,
          });
        }
      },
    });

  const { mutate: updateKey, isPending: isUpdating } =
    api.apiKey.update.useMutation({
      onSuccess: () => {
        utils.apiKey.list.invalidate();
        setEditingKey(null);
      },
    });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Keys
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-muted h-16 animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys
            </CardTitle>
            <CardDescription>Manage API keys for this project</CardDescription>
          </div>
          <CreateApiKeyDialog projectId={projectId} projectSlug={projectSlug} />
        </CardHeader>
        <CardContent>
          {!apiKeys?.length ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center py-8 text-center">
              <Key className="mb-3 h-10 w-10 opacity-50" />
              <p className="font-medium">No API keys yet</p>
              <p className="mt-1 text-sm">
                Create an API key to start using the image optimization service.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <ApiKeyItem
                  key={key.id}
                  apiKey={key}
                  onRevoke={() => revokeKey({ apiKeyId: key.id })}
                  onRotate={() => rotateKey({ apiKeyId: key.id })}
                  onEdit={() => setEditingKey({
                    id: key.id,
                    name: key.name,
                    allowedSourceDomains: key.allowedSourceDomains,
                    expiresAt: key.expiresAt,
                  })}
                  isRevoking={isRevoking}
                  isRotating={isRotating}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <RotatedKeyDialog
        rotatedKey={rotatedKey}
        onClose={() => setRotatedKey(null)}
      />

      <EditApiKeyDialog
        editingKey={editingKey}
        onClose={() => setEditingKey(null)}
        onSave={(domains, expiresAt) => {
          if (editingKey) {
            updateKey({
              apiKeyId: editingKey.id,
              allowedSourceDomains: domains,
              expiresAt: expiresAt,
            });
          }
        }}
        isUpdating={isUpdating}
      />
    </>
  );
}

type ApiKeyItemProps = {
  readonly apiKey: {
    id: string;
    name: string;
    keyPrefix: string;
    createdAt: Date;
    lastUsedAt: Date | null;
    expiresAt: Date | null;
    allowedSourceDomains: string[] | null;
  };
  readonly onRevoke: () => void;
  readonly onRotate: () => void;
  readonly onEdit: () => void;
  readonly isRevoking: boolean;
  readonly isRotating: boolean;
};

/**
 * Calculate expiration status for an API key
 */
function getExpirationStatus(expiresAt: Date | null): {
  readonly isExpired: boolean;
  readonly isExpiringSoon: boolean;
  readonly daysUntilExpiry: number | null;
} {
  if (!expiresAt) {
    return { isExpired: false, isExpiringSoon: false, daysUntilExpiry: null };
  }

  const now = new Date();
  const expiryDate = new Date(expiresAt);
  const daysUntilExpiry = differenceInDays(expiryDate, now);

  return {
    isExpired: daysUntilExpiry < 0,
    isExpiringSoon: daysUntilExpiry >= 0 && daysUntilExpiry <= 7,
    daysUntilExpiry,
  };
}

function ApiKeyItem({
  apiKey,
  onRevoke,
  onRotate,
  onEdit,
  isRevoking,
  isRotating,
}: ApiKeyItemProps) {
  const { isExpired, isExpiringSoon, daysUntilExpiry } = getExpirationStatus(apiKey.expiresAt);
  const domainCount = apiKey.allowedSourceDomains?.length ?? 0;

  // Render expiration badge based on status
  const renderExpirationBadge = (): React.ReactNode => {
    if (isExpired) {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="mr-1 h-3 w-3" />
          Expired
        </Badge>
      );
    }
    if (isExpiringSoon && daysUntilExpiry !== null) {
      return (
        <Badge variant="secondary" className="border-amber-500/50 bg-amber-500/10 text-xs text-amber-600 dark:text-amber-400">
          <Clock className="mr-1 h-3 w-3" />
          {daysUntilExpiry === 0 ? "Expires today" : `Expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"}`}
        </Badge>
      );
    }
    return null;
  };

  // Render expiration info text
  const renderExpirationInfo = (): React.ReactNode => {
    if (!apiKey.expiresAt) {
      return (
        <span className="text-muted-foreground flex items-center gap-1 text-xs">
          <Clock className="h-3 w-3" />
          No expiration
        </span>
      );
    }

    const expiryDate = new Date(apiKey.expiresAt);
    if (isExpired) {
      return (
        <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
          <Clock className="h-3 w-3" />
          Expired on {format(expiryDate, "MMM d, yyyy")}
        </span>
      );
    }

    return (
      <span className={`flex items-center gap-1 text-xs ${isExpiringSoon ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
        <Clock className="h-3 w-3" />
        Expires on {format(expiryDate, "MMM d, yyyy")}
      </span>
    );
  };

  return (
    <div className="bg-muted/50 hover:bg-muted/80 flex items-center justify-between rounded-lg p-4 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isExpired ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"}`}>
          <Key className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{apiKey.name}</span>
            {renderExpirationBadge()}
          </div>
          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
            <code className="bg-background rounded px-1.5 py-0.5 font-mono text-xs">
              {apiKey.keyPrefix}...
            </code>
            <CopyIcon text={`${apiKey.keyPrefix}...`} />
            <span className="text-muted-foreground">·</span>
            <span>
              Created{" "}
              {formatDistanceToNow(new Date(apiKey.createdAt), {
                addSuffix: true,
              })}
            </span>
            {apiKey.lastUsedAt && (
              <>
                <span className="text-muted-foreground">·</span>
                <span>
                  Last used{" "}
                  {formatDistanceToNow(new Date(apiKey.lastUsedAt), {
                    addSuffix: true,
                  })}
                </span>
              </>
            )}
          </div>
          {/* Display expiration info */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {renderExpirationInfo()}
            {/* Display allowed domains */}
            {domainCount > 0 ? (
              <span className="flex items-center gap-1.5">
                <Globe className="text-muted-foreground h-3.5 w-3.5" />
                <div className="flex flex-wrap items-center gap-1.5">
                  {apiKey.allowedSourceDomains!.slice(0, 3).map((domain) => (
                    <Badge
                      key={domain}
                      variant="outline"
                      className="font-mono text-xs"
                    >
                      {domain}
                    </Badge>
                  ))}
                  {domainCount > 3 && (
                    <span className="text-muted-foreground text-xs">
                      +{domainCount - 3} more
                    </span>
                  )}
                </div>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-500">
                <Globe className="h-3.5 w-3.5" />
                No domains configured
              </span>
            )}
          </div>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onRotate} disabled={isRotating}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Rotate Key
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onRevoke}
            disabled={isRevoking}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Revoke Key
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

type RotatedKeyDialogProps = {
  readonly rotatedKey: { key: string; secretKey: string; name: string } | null;
  readonly onClose: () => void;
};

function RotatedKeyDialog({ rotatedKey, onClose }: RotatedKeyDialogProps) {
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
                <Label className="text-muted-foreground flex items-center gap-1.5 text-xs tracking-wider uppercase">
                  <Key className="h-3 w-3" />
                  New Secret Key (for signing URLs)
                </Label>
                <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                  <Shield className="h-3 w-3" />
                  <span>Only shown once</span>
                </div>
              </div>
              <div className="bg-muted/50 border-border group relative rounded-lg border p-3">
                <code className="block pr-10 font-mono text-sm break-all">
                  {rotatedKey?.secretKey}
                </code>
                <div className="absolute top-2 right-2">
                  <CopyButton
                    text={rotatedKey?.secretKey ?? ""}
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 shadow-sm"
                  />
                </div>
              </div>
              <p className="text-muted-foreground text-xs">
                The old key is now invalid. Update your backend with this new
                secret key.
              </p>
            </div>

            {/* Key Prefix Display */}
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs tracking-wider uppercase">
                New Key Prefix (for URL parameter)
              </Label>
              <div className="bg-muted/50 border-border group relative rounded-lg border p-3">
                <code className="block pr-10 font-mono text-sm">
                  {rotatedKey?.key.substring(0, 12)}
                </code>
                <div className="absolute top-2 right-2">
                  <CopyButton
                    text={rotatedKey?.key.substring(0, 12) ?? ""}
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 shadow-sm"
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

type EditApiKeyDialogProps = {
  readonly editingKey: {
    id: string;
    name: string;
    allowedSourceDomains: string[] | null;
    expiresAt: Date | null;
  } | null;
  readonly onClose: () => void;
  readonly onSave: (domains: string[], expiresAt: Date | null) => void;
  readonly isUpdating: boolean;
};

function EditApiKeyDialog({
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

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const handleSave = () => {
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

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Allowed Source Domains</Label>
            <p className="text-muted-foreground text-xs">
              Which image sources can this key access? Subdomains are
              automatically included.
            </p>
            <DomainListInput
              value={domains}
              onChange={setDomains}
              placeholder="images.example.com"
              disabled={isUpdating}
              emptyMessage="Add at least one domain to enable this API key."
              variant="source"
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
