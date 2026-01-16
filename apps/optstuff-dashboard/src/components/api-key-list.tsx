"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Key, MoreHorizontal, Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
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
import { api } from "@/trpc/react";
import { CopyButton, CopyIcon } from "./copy-button";
import { ApiCodeExamples, DocsLink } from "./api-code-examples";
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-green-500" />
            API Key Rotated
          </DialogTitle>
          <DialogDescription>
            Your API key <strong>{rotatedKey?.name}</strong> has been rotated.
            The old key is now invalid. Make sure to copy the new key!
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto py-4">
          <Card className="border-amber-500/50 bg-amber-500/10">
            <CardContent className="flex items-start gap-3 pt-4">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
              <div className="text-sm">
                <p className="font-medium text-amber-600 dark:text-amber-400">
                  Update your applications
                </p>
                <p className="text-muted-foreground mt-1">
                  Replace the old key with this new one in all your applications.
                </p>
              </div>
            </CardContent>
          </Card>

          <div>
            <Label className="text-muted-foreground text-xs">
              Your New API Key
            </Label>
            <div className="mt-1.5 flex items-center gap-2">
              <code className="bg-muted flex-1 rounded-md px-3 py-2 font-mono text-sm break-all">
                {rotatedKey?.key}
              </code>
              <CopyButton text={rotatedKey?.key ?? ""} className="shrink-0" />
            </div>
          </div>

          {rotatedKey && <ApiCodeExamples apiKey={rotatedKey.key} />}
          <DocsLink />
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
