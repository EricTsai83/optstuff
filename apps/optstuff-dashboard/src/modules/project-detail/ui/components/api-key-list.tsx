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
import { formatDistanceToNow } from "date-fns";
import { Key, MoreHorizontal, RotateCcw, Shield, Trash2 } from "lucide-react";
import { useState } from "react";
import { ApiCodeExamples, DocsLink } from "./api-code-examples";
import { CopyButton, CopyIcon } from "./copy-button";
import { CreateApiKeyDialog } from "./create-api-key-dialog";

type ApiKeyListProps = {
  readonly projectId: string;
};

export function ApiKeyList({ projectId }: ApiKeyListProps) {
  const { data: apiKeys, isLoading } = api.apiKey.list.useQuery({ projectId });
  const [rotatedKey, setRotatedKey] = useState<{
    key: string;
    name: string;
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
        if (result?.key && result?.name) {
          setRotatedKey({ key: result.key, name: result.name });
        }
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
          <CreateApiKeyDialog projectId={projectId} />
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
  };
  readonly onRevoke: () => void;
  readonly onRotate: () => void;
  readonly isRevoking: boolean;
  readonly isRotating: boolean;
};

function ApiKeyItem({
  apiKey,
  onRevoke,
  onRotate,
  isRevoking,
  isRotating,
}: ApiKeyItemProps) {
  const isExpired = apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date();

  return (
    <div className="bg-muted/50 hover:bg-muted/80 flex items-center justify-between rounded-lg p-4 transition-colors">
      <div className="flex items-center gap-4">
        <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
          <Key className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{apiKey.name}</span>
            {isExpired && (
              <Badge variant="destructive" className="text-xs">
                Expired
              </Badge>
            )}
          </div>
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
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
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
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
  readonly rotatedKey: { key: string; name: string } | null;
  readonly onClose: () => void;
};

function RotatedKeyDialog({ rotatedKey, onClose }: RotatedKeyDialogProps) {
  return (
    <Dialog open={!!rotatedKey} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
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
            {/* API Key Display */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-xs tracking-wider uppercase">
                  Your New API Key
                </Label>
                <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                  <Shield className="h-3 w-3" />
                  <span>Only shown once</span>
                </div>
              </div>
              <div className="bg-muted/50 border-border group relative rounded-lg border p-3">
                <code className="block pr-10 font-mono text-sm break-all">
                  {rotatedKey?.key}
                </code>
                <div className="absolute top-2 right-2">
                  <CopyButton
                    text={rotatedKey?.key ?? ""}
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 shadow-sm"
                  />
                </div>
              </div>
              <p className="text-muted-foreground text-xs">
                The old key is now invalid. Update your applications with this
                new key.
              </p>
            </div>

            {/* Code Examples */}
            {rotatedKey && <ApiCodeExamples apiKey={rotatedKey.key} />}

            {/* Docs Link */}
            <DocsLink />
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
